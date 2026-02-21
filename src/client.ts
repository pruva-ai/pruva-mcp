import type { PruvaAction, PruvaApiError, PruvaApiResponse } from "./types.js";

export class PruvaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // strip trailing slash
  }

  async call<T = unknown>(
    action: PruvaAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api/mcp/data`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!res.ok) {
      let message = `Pruva API error (${res.status})`;
      try {
        const body = (await res.json()) as PruvaApiError;
        if (body.error) message = body.error;
      } catch {
        // ignore parse failure
      }
      throw new Error(message);
    }

    const body = (await res.json()) as PruvaApiResponse<T>;
    return body.data;
  }
}
