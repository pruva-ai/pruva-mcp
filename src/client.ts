import { resolveConfig } from "./config.js";
import type {
  ChatRequest,
  ChatResponse,
  PruvaAction,
  PruvaApiError,
  PruvaApiResponse,
} from "./types.js";

export class NotAuthenticatedError extends Error {
  constructor(
    message = "Not authenticated. Call the `pruva_login` tool first to authenticate.",
  ) {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

/**
 * Resolves the current API URL on every call by re-reading the shared
 * config file. This lets `pruva_login` swap the token in mid-session
 * without restarting the server.
 *
 * Token lookup precedence:
 *   1. PRUVA_API_URL env var (apiUrl override only)
 *   2. ~/.pruva/config.json
 */
export class PruvaClient {
  async call<T = unknown>(
    action: PruvaAction,
    params: Record<string, unknown> = {},
  ): Promise<PruvaApiResponse<T>> {
    const { apiUrl, accessToken } = resolveConfig();
    if (!accessToken) throw new NotAuthenticatedError();

    const url = `${stripTrailingSlash(apiUrl)}/api/mcp/data`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (res.status === 401) {
      throw new NotAuthenticatedError();
    }

    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }

    return (await res.json()) as PruvaApiResponse<T>;
  }

  async chat(params: ChatRequest): Promise<ChatResponse> {
    const { apiUrl, accessToken } = resolveConfig();
    if (!accessToken) throw new NotAuthenticatedError();

    const url = `${stripTrailingSlash(apiUrl)}/api/mcp/chat`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    });

    if (res.status === 401) {
      throw new NotAuthenticatedError();
    }

    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }

    const body = (await res.json()) as PruvaApiResponse<ChatResponse>;
    return body.data;
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as PruvaApiError;
    if (body.error) return body.error;
  } catch {
    // ignore parse failure
  }
  return `Pruva API error (${res.status})`;
}
