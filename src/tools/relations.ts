import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { FeatureRelation } from "../types.js";
import { markdownResult, wrapToolHandler } from "./helpers.js";

export function registerRelationTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_feature_relations",
    "List all feature relations (dependencies, blocks, relates-to) for a product. Returns a markdown list.",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const env = await client.call<FeatureRelation[]>(
        "list_feature_relations",
        { productId },
      );
      return markdownResult(env.markdown);
    }),
  );
}
