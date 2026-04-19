import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PruvaClient } from "../client.js";
import type { DocumentFull, DocumentSummary, Product } from "../types.js";

export function registerDocumentResources(
  server: McpServer,
  client: PruvaClient,
) {
  // ── Documents list for a product ────────────────────────────
  server.resource(
    "product-documents",
    new ResourceTemplate("pruva://products/{productId}/documents", {
      list: async () => {
        const products = await client.call<Product[]>("list_products");
        return {
          resources: products.map((p) => ({
            uri: `pruva://products/${p.id}/documents`,
            name: `${p.name} — Documents`,
            mimeType: "application/json" as const,
          })),
        };
      },
    }),
    { mimeType: "application/json" },
    async (uri, { productId }) => {
      const data = await client.call<DocumentSummary[]>("list_documents", {
        productId: productId as string,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  // ── Single document content (path-based) ────────────────────
  // URI format: pruva://products/{productId}/documents/{path}
  // `path` may contain slashes — the MCP SDK URI template handles single segments,
  // so clients should URL-encode slashes in nested paths (e.g. "features%2Fauth.md").
  server.resource(
    "document",
    new ResourceTemplate(
      "pruva://products/{productId}/documents/{path}",
      { list: undefined },
    ),
    { mimeType: "text/markdown" },
    async (uri, { productId, path }) => {
      const decodedPath = decodeURIComponent(path as string);
      const data = await client.call<DocumentFull>("get_document", {
        productId: productId as string,
        path: decodedPath,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: data.content ?? "",
          },
        ],
      };
    },
  );
}
