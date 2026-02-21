import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { DocumentFull, DocumentMeta, SearchResult } from "../types.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

export function registerDocumentTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_documents",
    "List documents for a product, optionally filtered by type or feature",
    {
      productId: z.string().describe("The product UUID"),
      docType: z.string().optional().describe("Filter by document type"),
      featureId: z.string().optional().describe("Filter by feature UUID"),
    },
    wrapToolHandler(async ({ productId, docType, featureId }) => {
      const data = await client.call<DocumentMeta[]>("list_documents", {
        productId,
        docType,
        featureId,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_get_document",
    "Get a document's full content and metadata",
    { documentId: z.string().describe("The document UUID") },
    wrapToolHandler(async ({ documentId }) => {
      const data = await client.call<DocumentFull>("get_document", {
        documentId,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_create_document",
    "Create a new document within a product",
    {
      productId: z.string().describe("The product UUID"),
      path: z.string().describe("Document path (e.g. features/auth/spec.md)"),
      content: z.string().describe("Document content (Markdown)"),
      docType: z.string().describe("Document type (e.g. feature-content, prd, tech-spec)"),
      featureId: z.string().optional().describe("Associated feature UUID"),
    },
    wrapToolHandler(async ({ productId, path, content, docType, featureId }) => {
      const data = await client.call<DocumentFull>("create_document", {
        productId,
        path,
        content,
        docType,
        featureId,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_update_document",
    "Update a document's content or path",
    {
      documentId: z.string().describe("The document UUID"),
      content: z.string().optional().describe("New document content"),
      path: z.string().optional().describe("New document path"),
    },
    wrapToolHandler(async ({ documentId, content, path }) => {
      const data = await client.call<DocumentFull>("update_document", {
        documentId,
        content,
        path,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_search_documents",
    "Search documents by content within a product",
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
