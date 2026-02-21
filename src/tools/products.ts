import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PruvaClient } from "../client.js";
import type { Product } from "../types.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

export function registerProductTools(server: McpServer, client: PruvaClient) {
  server.tool(
    "pruva_list_products",
    "List all active products in your Pruva workspace",
    {},
    wrapToolHandler(async () => {
      const data = await client.call<Product[]>("list_products");
      return jsonResult(data);
    }),
  );

  server.tool(
    "pruva_get_product",
    "Get details of a specific product",
    { productId: z.string().describe("The product UUID") },
    wrapToolHandler(async ({ productId }) => {
      const data = await client.call<Product>("get_product", { productId });
      return jsonResult(data);
    }),
  );
}
