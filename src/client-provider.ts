import type { PruvaClient } from "./client.js";

/**
 * Returns a `PruvaClient` for the current request.
 *
 * The deploy wrapper builds a fresh client per call from the per-request
 * Bearer token, sourced from the MCP SDK's `extra.authInfo`.
 */
export type ClientProvider = (
  extra?: { authInfo?: { token?: string } },
) => PruvaClient;
