import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClientProvider } from "../client-provider.js";
import type { Product, ProductDetail } from "../types.js";
import { markdownResult, wrapToolHandler } from "./helpers.js";

export function registerProductTools(
  server: McpServer,
  getClient: ClientProvider,
) {
  server.tool(
    "pruva_list_products",
    "List all active products in your Pruva workspace. Returns a markdown summary.",
    {},
    wrapToolHandler(async (_params, extra) => {
      const env = await getClient(extra).call<Product[]>("list_products");
      return markdownResult(env.markdown);
    }),
  );

  server.tool(
    "pruva_get_product",
    "Get details of a specific product, including feature and document counts. Returns a markdown summary.",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }, extra) => {
      const env = await getClient(extra).call<ProductDetail>("get_product", {
        productId,
      });
      return markdownResult(env.markdown);
    }),
  );
}
