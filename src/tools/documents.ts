import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClientProvider } from "../client-provider.js";
import type {
  DocumentFull,
  DocumentSummary,
  SearchResult,
} from "../types.js";
import { markdownResult, wrapToolHandler } from "./helpers.js";

export function registerDocumentTools(
  server: McpServer,
  getClient: ClientProvider,
) {
  server.tool(
    "pruva_list_documents",
    "List all context documents for a product (with content previews). Returns a markdown summary.",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }, extra) => {
      const env = await getClient(extra).call<DocumentSummary[]>(
        "list_documents",
        { productId },
      );
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_get_document",
    "Get a document's full content by path. Returns markdown.",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("The document path (e.g. overview.md)"),
    },
    wrapToolHandler(async ({ productId, path }, extra) => {
      const env = await getClient(extra).call<DocumentFull>("get_document", {
        productId,
        path,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_create_document",
    "Create a new context document within a product. Returns a markdown confirmation.",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("Document path (e.g. overview.md)"),
      content: z.string().describe("Document content (Markdown)"),
    },
    wrapToolHandler(async ({ productId, path, content }, extra) => {
      const env = await getClient(extra).call<DocumentFull>("create_document", {
        productId,
        path,
        content,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_update_document",
    "Update an existing context document's content. Returns a markdown confirmation.",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("The document path"),
      content: z.string().describe("New document content"),
    },
    wrapToolHandler(async ({ productId, path, content }, extra) => {
      const env = await getClient(extra).call<DocumentFull>("update_document", {
        productId,
        path,
        content,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_search_documents",
    "Search context documents by content within a product. Returns a markdown list of matches.",
    {
      productId: z.string().describe("The product UUID"),
      query: z.string().describe("Search query string"),
    },
    wrapToolHandler(async ({ productId, query }, extra) => {
      const env = await getClient(extra).call<SearchResult[]>(
        "search_documents",
        { productId, query },
      );
      return markdownResult(env.markdown);
    }),
  );
}
