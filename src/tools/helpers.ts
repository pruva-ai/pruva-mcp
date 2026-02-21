import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Wraps a tool handler so that any thrown error is returned as
 * `{ isError: true, content: [...] }` instead of crashing the server.
 */
export function wrapToolHandler(
  fn: (params: Record<string, unknown>) => Promise<CallToolResult>,
): (params: Record<string, unknown>) => Promise<CallToolResult> {
  return async (params) => {
    try {
      return await fn(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  };
}

/** Helper to return JSON data as a tool result */
export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
