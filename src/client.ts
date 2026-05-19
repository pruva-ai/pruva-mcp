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
 * HTTP client for the Pruva data API.
 *
 * Both `apiUrl` and `accessToken` are injected at construction time so the
 * same class can serve two transports:
 *   - stdio (local npm) — token comes from `~/.pruva/config.json` once at boot
 *   - HTTP (remote deploy) — token comes from a per-request Bearer header,
 *     so the wrapper constructs a fresh client per call
 *
 * An empty `accessToken` is allowed (so stdio can boot before login). Calls
 * will throw `NotAuthenticatedError` until a real token is supplied.
 */
export class PruvaClient {
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(apiUrl: string, accessToken: string) {
    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
  }

  async call<T = unknown>(
    action: PruvaAction,
    params: Record<string, unknown> = {},
  ): Promise<PruvaApiResponse<T>> {
    if (!this.accessToken) throw new NotAuthenticatedError();

    const url = `${stripTrailingSlash(this.apiUrl)}/api/mcp/data`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
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
    if (!this.accessToken) throw new NotAuthenticatedError();

    const url = `${stripTrailingSlash(this.apiUrl)}/api/mcp/chat`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
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
