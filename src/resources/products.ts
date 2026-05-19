import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientProvider } from "../client-provider.js";
import type {
  FeatureRelation,
  FeatureSummary,
  Product,
  ProductDetail,
} from "../types.js";

export function registerProductResources(
  server: McpServer,
  getClient: ClientProvider,
) {
  // ── Product details ─────────────────────────────────────────
  server.resource(
    "product",
    new ResourceTemplate("pruva://products/{productId}", {
      list: async (extra) => {
        const env = await getClient(extra).call<Product[]>("list_products");
        return {
          resources: env.data.map((p) => ({
            uri: `pruva://products/${p.id}`,
            name: p.name,
            mimeType: "text/markdown" as const,
          })),
        };
      },
    }),
    { mimeType: "text/markdown" },
    async (uri, { productId }, extra) => {
      const env = await getClient(extra).call<ProductDetail>("get_product", {
        productId: productId as string,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: env.markdown,
          },
        ],
      };
    },
  );

  // ── Features list for a product ─────────────────────────────
  server.resource(
    "product-features",
    new ResourceTemplate("pruva://products/{productId}/features", {
      list: async (extra) => {
        const env = await getClient(extra).call<Product[]>("list_products");
        return {
          resources: env.data.map((p) => ({
            uri: `pruva://products/${p.id}/features`,
            name: `${p.name} — Features`,
            mimeType: "text/markdown" as const,
          })),
        };
      },
    }),
    { mimeType: "text/markdown" },
    async (uri, { productId }, extra) => {
      const env = await getClient(extra).call<FeatureSummary[]>(
        "list_features",
        { productId: productId as string },
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: env.markdown,
          },
        ],
      };
    },
  );

  // ── Feature relations for a product ─────────────────────────
  server.resource(
    "product-relations",
    new ResourceTemplate("pruva://products/{productId}/relations", {
      list: async (extra) => {
        const env = await getClient(extra).call<Product[]>("list_products");
        return {
          resources: env.data.map((p) => ({
            uri: `pruva://products/${p.id}/relations`,
            name: `${p.name} — Feature Relations`,
            mimeType: "text/markdown" as const,
          })),
        };
      },
    }),
    { mimeType: "text/markdown" },
    async (uri, { productId }, extra) => {
      const env = await getClient(extra).call<FeatureRelation[]>(
        "list_feature_relations",
        { productId: productId as string },
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: env.markdown,
          },
        ],
      };
    },
  );
}
