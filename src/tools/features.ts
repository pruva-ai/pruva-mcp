import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { FeatureDetail, FeatureSummary } from "../types.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

export function registerFeatureTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_features",
    "List all features for a product",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const data = await client.call<FeatureSummary[]>("list_features", {
        productId,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_get_feature",
    "Get details of a specific feature by slug",
    {
      productId: z.string().describe("The product UUID"),
      slug: z.string().describe("The feature slug"),
    },
    wrapToolHandler(async ({ productId, slug }) => {
      const data = await client.call<FeatureDetail>("get_feature", {
        productId,
        slug,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_create_feature",
    "Create a new feature within a product",
    {
      productId: z.string().describe("The product UUID"),
      slug: z.string().describe("URL-safe feature slug (unique per product)"),
      title: z.string().describe("Feature title"),
      content: z
        .string()
        .optional()
        .describe("Initial feature content (YAML). Defaults to a title-only stub."),
    },
    wrapToolHandler(async ({ productId, slug, title, content }) => {
      const data = await client.call<FeatureDetail>("create_feature", {
        productId,
        slug,
        title,
        content,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_update_feature",
    "Update a feature's content",
    {
      productId: z.string().describe("The product UUID"),
      slug: z.string().describe("The feature slug"),
      content: z.string().describe("New feature content (YAML)"),
    },
    wrapToolHandler(async ({ productId, slug, content }) => {
      const data = await client.call<FeatureSummary>("update_feature", {
        productId,
        slug,
        content,
      });
      return jsonResult(data);
    }),
  );
}
