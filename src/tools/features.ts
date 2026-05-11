import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { FeatureDetail, FeatureSummary } from "../types.js";
import { markdownResult, wrapToolHandler } from "./helpers.js";

export function registerFeatureTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_features",
    "List all features for a product. Returns a markdown summary.",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const env = await client.call<FeatureSummary[]>("list_features", {
        productId,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_get_feature",
    "Get details of a specific feature by slug, including wireframes. Returns a markdown body.",
    {
      productId: z.string().describe("The product UUID"),
      slug: z.string().describe("The feature slug"),
    },
    wrapToolHandler(async ({ productId, slug }) => {
      const env = await client.call<FeatureDetail>("get_feature", {
        productId,
        slug,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_create_feature",
    "Create a new feature within a product. Returns a markdown confirmation.",
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
      const env = await client.call<FeatureDetail>("create_feature", {
        productId,
        slug,
        title,
        content,
      });
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_update_feature",
    "Update a feature's content. Returns a markdown confirmation.",
    {
      productId: z.string().describe("The product UUID"),
      slug: z.string().describe("The feature slug"),
      content: z.string().describe("New feature content (YAML)"),
    },
    wrapToolHandler(async ({ productId, slug, content }) => {
      const env = await client.call<FeatureSummary>("update_feature", {
        productId,
        slug,
        content,
      });
      return markdownResult(env.markdown);
    }),
  );
}
