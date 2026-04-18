import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PruvaClient } from "./client.js";
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
    version: "1.0.0",
  });

  // Register tools
  registerProductTools(server, client);
  registerFeatureTools(server, client);
  registerDocumentTools(server, client);
  registerRelationTools(server, client);
  registerChatTools(server, client);

  // Register resources
  registerProductResources(server, client);
  registerDocumentResources(server, client);

  return server;
}
