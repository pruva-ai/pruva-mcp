import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { Feature } from "../types.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

export function registerFeatureTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_features",
    "List all features for a product",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const data = await client.call<Feature[]>("list_features", { productId });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_get_feature",
    "Get details of a specific feature",
    { featureId: z.string().describe("The feature UUID") },
    wrapToolHandler(async ({ featureId }) => {
      const data = await client.call<Feature>("get_feature", { featureId });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_create_feature",
    "Create a new feature within a product. Automatically scaffolds initial documents.",
    {
      productId: z.string().describe("The product UUID"),
      title: z.string().describe("Feature title"),
      brief: z.string().optional().describe("Short description of the feature"),
    },
    wrapToolHandler(async ({ productId, title, brief }) => {
      const data = await client.call<Feature>("create_feature", {
        productId,
        title,
        brief,
      });
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_update_feature",
    "Update a feature's title or status",
    {
      featureId: z.string().describe("The feature UUID"),
      title: z.string().optional().describe("New title"),
      status: z.string().optional().describe("New status (e.g. in-progress, done)"),
    },
    wrapToolHandler(async ({ featureId, title, status }) => {
      const data = await client.call<Feature>("update_feature", {
        featureId,
        title,
        status,
      });
      return jsonResult(data);
    }),
  );
}
