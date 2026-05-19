import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PruvaClient } from "./client.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerChatTools } from "./tools/chat.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerFeatureTools } from "./tools/features.js";
import { registerProductTools } from "./tools/products.js";
import { registerRelationTools } from "./tools/relations.js";
import { registerProductResources } from "./resources/products.js";
import { registerDocumentResources } from "./resources/documents.js";

const pkg = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8",
  ),
) as { version: string };

/**
 * Builds the MCP server with all tools registered.
 *
 * `options.mode` controls which tools are exposed:
 *   - `"stdio"` (default) — includes `pruva_login`, which runs the device-code
 *     flow and writes a token to disk. Safe for local single-user processes.
 *   - `"http"` — omits `pruva_login`. Browser-spawning + 5min poll + disk
 *     writes are incompatible with serverless / multi-tenant deploys; the
 *     wrapping host is expected to inject a token per request instead.
 */
export function createPruvaServer(
  client: PruvaClient,
  options: { mode?: "stdio" | "http" } = {},
): McpServer {
  const mode = options.mode ?? "stdio";
  const server = new McpServer(
    {
      name: "pruva",
      version: pkg.version,
    },
    {
      capabilities: { logging: {} },
    },
  );

  // Auth tool — stdio only. In HTTP mode the host supplies the token directly.
  if (mode === "stdio") {
    registerAuthTools(server);
  }

  // Data tools — require an access token in the config
  registerProductTools(server, client);
  registerFeatureTools(server, client);
  registerDocumentTools(server, client);
  registerRelationTools(server, client);
  registerChatTools(server, client);

  // Resources
  registerProductResources(server, client);
  registerDocumentResources(server, client);

  return server;
}
