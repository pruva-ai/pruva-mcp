import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  DEFAULT_API_URL,
  resolveConfig,
  writeConfigFile,
} from "../config.js";
import { wrapToolHandler } from "./helpers.js";

const CLIENT_NAME = "pruva-mcp";
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes — keeps below typical MCP client timeouts
const DEFAULT_INTERVAL_S = 5;

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenSuccess {
  access_token: string;
  token_type: string;
  expires_in: number;
  email?: string;
  user_id?: string;
}

interface TokenError {
  error: string;
  error_description?: string;
}

function textResult(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

function resolveApiUrl(override?: string): string {
  if (override) return override;
  if (process.env.PRUVA_API_URL) return process.env.PRUVA_API_URL;
  try {
    return resolveConfig().apiUrl;
  } catch {
    return DEFAULT_API_URL;
  }
}

async function requestDeviceCode(apiUrl: string): Promise<DeviceCodeResponse> {
  const res = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/api/oauth/device/code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: CLIENT_NAME }),
    },
  );
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // ignore
    }
    throw new Error(`Failed to start device code flow: ${detail}`);
  }
  return (await res.json()) as DeviceCodeResponse;
}

async function pollToken(
  apiUrl: string,
  deviceCode: string,
): Promise<TokenSuccess | TokenError> {
  const res = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/api/oauth/device/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code: deviceCode }),
    },
  );
  if (res.ok) return (await res.json()) as TokenSuccess;
  try {
    return (await res.json()) as TokenError;
  } catch {
    return { error: `http_${res.status}` };
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DeviceLoginDeps {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  maxWaitMs?: number;
}

/**
 * Run the full device-code flow: request a code, print the user-facing
 * instructions, poll for approval, and persist the token on success.
 * Exposed for tests.
 */
export async function runDeviceLogin(
  apiUrl: string,
  deps: DeviceLoginDeps = {},
): Promise<CallToolResult> {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? defaultSleep;
  const maxWaitMs = deps.maxWaitMs ?? MAX_WAIT_MS;

  const device = await requestDeviceCode(apiUrl);
  const intro = [
    "To authenticate, visit:",
    device.verification_uri_complete,
    "",
    `Or go to ${device.verification_uri} and enter code: ${device.user_code}`,
    "",
    `Waiting for approval... (expires in ${device.expires_in}s)`,
  ].join("\n");

  const start = now();
  const expiresAt = start + device.expires_in * 1000;
  const deadline = Math.min(expiresAt, start + maxWaitMs);
  let interval = (device.interval || DEFAULT_INTERVAL_S) * 1000;

  while (now() < deadline) {
    await sleep(interval);
    if (now() >= deadline) break;
    const result = await pollToken(apiUrl, device.device_code);

    if ("access_token" in result) {
      writeConfigFile({
        apiUrl,
        accessToken: result.access_token,
        email: result.email,
      });
      const who = result.email ?? result.user_id ?? "your account";
      return textResult(
        `${intro}\n\nAuthenticated as ${who}. You can now use the other Pruva tools.`,
      );
    }

    const err = result.error;
    if (err === "authorization_pending") continue;
    if (err === "slow_down") {
      interval = interval * 2;
      continue;
    }
    if (err === "expired_token") {
      return textResult(
        `${intro}\n\nCode expired. Run \`pruva_login\` again to start over.`,
      );
    }
    if (err === "access_denied") {
      return textResult(
        `${intro}\n\nAuthorization denied. Run \`pruva_login\` to try again.`,
      );
    }
    return textResult(`${intro}\n\nAuthentication failed: ${err}`);
  }

  return textResult(
    [
      intro,
      "",
      "Approval not received yet. Once you've approved in the browser, call `pruva_login` again to capture the token.",
    ].join("\n"),
  );
}

export function registerAuthTools(server: McpServer) {
  server.tool(
    "pruva_login",
    "Authenticate Pruva MCP with your account via OAuth device code flow. Returns a browser approval URL and waits for confirmation. Call this once before using any other Pruva tool.",
    {
      url: z
        .string()
        .url()
        .optional()
        .describe(
          "Optional API URL override (e.g. for staging). Defaults to the configured or built-in URL.",
        ),
    },
    wrapToolHandler(async (params) => {
      const url = typeof params.url === "string" ? params.url : undefined;
      const apiUrl = resolveApiUrl(url);
      return runDeviceLogin(apiUrl);
    }),
  );
}
