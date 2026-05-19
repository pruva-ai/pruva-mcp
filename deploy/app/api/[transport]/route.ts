/**
 * Remote MCP endpoint for Pruva.
 *
 * Mounted at `/api/[transport]/route.ts`, which serves both:
 *   - `/api/mcp`  — Streamable HTTP transport (recommended)
 *   - `/api/sse`  — Server-Sent Events transport (legacy clients)
 *
 * Auth model
 * ----------
 * The Pruva backend (`/api/mcp/data`) already validates the Bearer token on
 * every call by sha256-hashing it and looking it up in `personal_access_tokens`.
 * That means this wrapper does NOT need its own Supabase connection, and does
 * NOT need to re-verify token validity locally — it just needs to surface the
 * caller's token to the per-call `PruvaClient`.
 *
 * Why `withMcpAuth` + a permissive `verifyToken`
 * ----------------------------------------------
 * `mcp-handler` (formerly `@vercel/mcp-adapter`) instantiates the `McpServer`
 * once when `createMcpHandler` is called at module load, so a static `client`
 * injected at registration time cannot carry a per-request token. The
 * `withMcpAuth` wrapper extracts the Bearer header per request and exposes it
 * to tool handlers via `extra.authInfo.token`.
 *
 * Our `verifyToken` only enforces "a Bearer was supplied" (returns 401
 * otherwise). Actual validity is checked downstream by `/api/mcp/data`, which
 * returns 401 on revoked / expired / unknown tokens — the `PruvaClient` raises
 * `NotAuthenticatedError`, the tool handler returns an MCP error, and the
 * client sees a 401-equivalent.
 *
 * The tool registration (in `pruva-mcp/src/server.ts`) accepts a
 * `ClientProvider` that reads `extra.authInfo.token` per call and builds a
 * fresh `PruvaClient` from it, so this single handler safely serves many
 * tenants concurrently.
 *
 * Source resolution
 * -----------------
 * We import the parent `pruva-mcp` package from its built `dist/` rather than
 * its `src/`. Next's externalDir TS compilation does not rewrite the parent's
 * ESM `.js` import specifiers to `.ts`, so consuming the published JS shape is
 * simpler and matches how downstream consumers use the package.
 */

import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { PruvaClient } from "../../../../dist/client.js";
import type { ClientProvider } from "../../../../dist/client-provider.js";
import { registerProductTools } from "../../../../dist/tools/products.js";
import { registerFeatureTools } from "../../../../dist/tools/features.js";
import { registerDocumentTools } from "../../../../dist/tools/documents.js";
import { registerRelationTools } from "../../../../dist/tools/relations.js";
import { registerChatTools } from "../../../../dist/tools/chat.js";
import { registerProductResources } from "../../../../dist/resources/products.js";
import { registerDocumentResources } from "../../../../dist/resources/documents.js";

const DEFAULT_API_URL = "https://www.pruva.ai";
const apiUrl = process.env.PRUVA_API_URL ?? DEFAULT_API_URL;

// Per-call client factory. Reads the verified Bearer token off `extra.authInfo`
// (populated by `withMcpAuth`) and builds a fresh `PruvaClient`. Clients are
// cheap; statelessness keeps the request path safe for serverless.
const getClient: ClientProvider = (extra) => {
  const token = extra?.authInfo?.token ?? "";
  return new PruvaClient(apiUrl, token);
};

function registerAll(server: McpServer, provider: ClientProvider) {
  // HTTP mode — no `pruva_login` tool. The host (this wrapper) supplies the
  // token per request via the Bearer header.
  registerProductTools(server, provider);
  registerFeatureTools(server, provider);
  registerDocumentTools(server, provider);
  registerRelationTools(server, provider);
  registerChatTools(server, provider);
  registerProductResources(server, provider);
  registerDocumentResources(server, provider);
}

// Build the MCP handler once at module load. The setup callback is invoked
// exactly once to register tools / resources on the underlying `McpServer`.
const mcpHandler = createMcpHandler(
  (server) => {
    registerAll(server, getClient);
  },
  {
    serverInfo: {
      name: "pruva",
      version: "0.4.2",
    },
  },
  { basePath: "/api" },
);

// `verifyToken` only checks the Bearer is present and non-empty. The Pruva
// backend re-validates on every API call (hash lookup, revocation check,
// expiry check), so duplicating that here would add latency without adding
// security.
async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken || bearerToken.trim().length === 0) return undefined;
  return {
    token: bearerToken,
    scopes: [],
    clientId: "pruva-mcp",
  };
}

// When clients hit this endpoint without a Bearer, `withMcpAuth` returns 401
// with a `WWW-Authenticate: Bearer resource_metadata="..."` header pointing at
// the protected-resource metadata endpoint defined under
// `app/.well-known/oauth-protected-resource/route.ts`. That metadata in turn
// tells the client which authorization server to use to obtain a token.
const authHandler = withMcpAuth(mcpHandler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
