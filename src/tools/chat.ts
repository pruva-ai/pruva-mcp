import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClientProvider } from "../client-provider.js";
import { jsonResult, wrapToolHandler } from "./helpers.js";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export function registerChatTools(
  server: McpServer,
  getClient: ClientProvider,
) {
  server.tool(
    "pruva_ask",
    "Ask the Pruva analysis agent a read-only question about a product. The agent can analyse features, documents, and relations but cannot modify anything.",
    {
      productId: z.string().uuid().describe("The product UUID"),
      message: z
        .string()
        .min(1)
        .describe("The question or message to send to the agent"),
      history: z
        .array(chatMessageSchema)
        .optional()
        .describe("Optional prior conversation turns for multi-turn context"),
      featureSlug: z
        .string()
        .optional()
        .describe("Optional feature slug to focus the agent on a feature"),
    },
    wrapToolHandler(
      async ({ productId, message, history, featureSlug }, extra) => {
        const data = await getClient(extra).chat({
          productId: productId as string,
          message: message as string,
          history: history as
            | { role: "user" | "assistant"; content: string }[]
            | undefined,
          featureSlug: featureSlug as string | undefined,
        });
        return jsonResult(data);
      },
    ),
  );
}
