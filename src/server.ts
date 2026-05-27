import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientProvider } from "./client-provider.js";
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
 * Builds the MCP server with all tools and resources registered.
 *
 * Takes a per-request `ClientProvider` so the wrapping HTTP host can build a
 * fresh `PruvaClient` for each MCP request from the Bearer token surfaced via
 * `extra.authInfo.token`.
 */
export function createPruvaServer(getClient: ClientProvider): McpServer {
  const server = new McpServer(
    {
      name: "pruva",
      version: pkg.version,
    },
    {
      capabilities: { logging: {} },
    },
  );

  registerProductTools(server, getClient);
  registerFeatureTools(server, getClient);
  registerDocumentTools(server, getClient);
  registerRelationTools(server, getClient);
  registerChatTools(server, getClient);

  registerProductResources(server, getClient);
  registerDocumentResources(server, getClient);

  return server;
}
