import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClientProvider } from "../client-provider.js";
import type { FeatureRelation } from "../types.js";
import { markdownResult, wrapToolHandler } from "./helpers.js";

export function registerRelationTools(
  server: McpServer,
  getClient: ClientProvider,
) {
  server.tool(
    "pruva_list_feature_relations",
    "List all feature relations (dependencies, blocks, relates-to) for a product. Returns a markdown list.",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }, extra) => {
      const env = await getClient(extra).call<FeatureRelation[]>(
        "list_feature_relations",
        { productId },
      );
      return markdownResult(env.markdown);
    }),
  );
}
