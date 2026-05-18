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

export function createPruvaServer(client: PruvaClient): McpServer {
  const server = new McpServer({
    name: "pruva",
    version: "0.3.0",
  });

  // Auth tool — always available so users can log in from inside the MCP client
  registerAuthTools(server);

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
