import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientProvider } from "../client-provider.js";
import type { DocumentFull, DocumentSummary, Product } from "../types.js";

export function registerDocumentResources(
  server: McpServer,
  getClient: ClientProvider,
) {
  // ── Documents list for a product ────────────────────────────
  server.resource(
    "product-documents",
    new ResourceTemplate("pruva://products/{productId}/documents", {
      list: async (extra) => {
        const env = await getClient(extra).call<Product[]>("list_products");
        return {
          resources: env.data.map((p) => ({
            uri: `pruva://products/${p.id}/documents`,
            name: `${p.name} — Documents`,
            mimeType: "text/markdown" as const,
          })),
        };
      },
    }),
    { mimeType: "text/markdown" },
    async (uri, { productId }, extra) => {
      const env = await getClient(extra).call<DocumentSummary[]>(
        "list_documents",
        { productId: productId as string },
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: env.markdown,
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
    async (uri, { productId, path }, extra) => {
      const decodedPath = decodeURIComponent(path as string);
      const env = await getClient(extra).call<DocumentFull>("get_document", {
        productId: productId as string,
        path: decodedPath,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: env.data.content ?? "",
          },
        ],
      };
    },
  );
}
