import type { PruvaClient } from "./client.js";

/**
 * Returns a `PruvaClient` for the current request.
 *
 * In stdio / single-tenant HTTP mode this is a constant — the same client
 * (with a long-lived access token) is returned every call.
 *
 * In multi-tenant HTTP mode (Vercel deploy wrapper) the provider builds a
 * fresh client per call from the per-request Bearer token, sourced from the
 * MCP SDK's `extra.authInfo`.
 */
export type ClientProvider = (
  extra?: { authInfo?: { token?: string } },
) => PruvaClient;

/** Wraps a static client as a `ClientProvider`. */
export function staticClient(client: PruvaClient): ClientProvider {
  return () => client;
}
