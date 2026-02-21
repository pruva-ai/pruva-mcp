import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PruvaClient } from "../client.js";
import type { Feature, FeatureRelation, Product } from "../types.js";

export function registerProductResources(
  server: McpServer,
  client: PruvaClient,
) {
  // ── Product details ─────────────────────────────────────────
  server.resource(
    "product",
    new ResourceTemplate("pruva://products/{productId}", {
      list: async () => {
        const products = await client.call<Product[]>("list_products");
        return {
          resources: products.map((p) => ({
            uri: `pruva://products/${p.id}`,
            name: p.name,
            description: p.description ?? undefined,
            mimeType: "application/json" as const,
          })),
        };
      },
    }),
    { mimeType: "application/json" },
    async (uri, { productId }) => {
      const data = await client.call<Product>("get_product", {
        productId: productId as string,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  // ── Features list for a product ─────────────────────────────
  server.resource(
    "product-features",
    new ResourceTemplate("pruva://products/{productId}/features", {
      list: async () => {
        const products = await client.call<Product[]>("list_products");
        return {
          resources: products.map((p) => ({
            uri: `pruva://products/${p.id}/features`,
            name: `${p.name} — Features`,
            mimeType: "application/json" as const,
          })),
        };
      },
    }),
    { mimeType: "application/json" },
    async (uri, { productId }) => {
      const data = await client.call<Feature[]>("list_features", {
        productId: productId as string,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  // ── Feature relations for a product ─────────────────────────
  server.resource(
    "product-relations",
    new ResourceTemplate("pruva://products/{productId}/relations", {
      list: async () => {
        const products = await client.call<Product[]>("list_products");
        return {
          resources: products.map((p) => ({
            uri: `pruva://products/${p.id}/relations`,
            name: `${p.name} — Feature Relations`,
            mimeType: "application/json" as const,
          })),
        };
      },
    }),
    { mimeType: "application/json" },
    async (uri, { productId }) => {
      const data = await client.call<FeatureRelation[]>(
        "get_feature_relations",
        { productId: productId as string },
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
}
