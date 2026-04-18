import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type {
  DocumentFull,
  DocumentSummary,
  SearchResult,
} from "../types.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

export function registerDocumentTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_documents",
    "List all context documents for a product (with content previews)",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const data = await client.call<DocumentSummary[]>("list_documents", {
        productId,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_get_document",
    "Get a document's full content by path",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("The document path (e.g. overview.md)"),
    },
    wrapToolHandler(async ({ productId, path }) => {
      const data = await client.call<DocumentFull>("get_document", {
        productId,
        path,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_create_document",
    "Create a new context document within a product",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("Document path (e.g. overview.md)"),
      content: z.string().describe("Document content (Markdown)"),
    },
    wrapToolHandler(async ({ productId, path, content }) => {
      const data = await client.call<DocumentFull>("create_document", {
        productId,
        path,
        content,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_update_document",
    "Update an existing context document's content",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("The document path"),
      content: z.string().describe("New document content"),
    },
    wrapToolHandler(async ({ productId, path, content }) => {
      const data = await client.call<DocumentFull>("update_document", {
        productId,
        path,
        content,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_search_documents",
    "Search context documents by content within a product",
    {
      productId: z.string().describe("The product UUID"),
      query: z.string().describe("Search query string"),
    },
    wrapToolHandler(async ({ productId, query }) => {
      const data = await client.call<SearchResult[]>("search_documents", {
        productId,
        query,
      });
      return jsonResult(data);
    }),
  );
}
