import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runDeviceLogin } from "../../tools/auth.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deviceCodeBody(overrides: Record<string, unknown> = {}) {
  return {
    device_code: "dev-123",
    user_code: "USER-CODE",
    verification_uri: "https://example.com/device",
    verification_uri_complete:
      "https://example.com/device?user_code=USER-CODE",
    expires_in: 600,
    interval: 5,
    ...overrides,
  };
}

let tmpHome: string;
let originalHome: string | undefined;

beforeEach(() => {
  mockFetch.mockReset();
  tmpHome = mkdtempSync(join(tmpdir(), "pruva-mcp-auth-"));
  originalHome = process.env.HOME;
  process.env.HOME = tmpHome;
});

afterEach(() => {
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  rmSync(tmpHome, { recursive: true, force: true });
});

function fakeClock() {
  let t = 1_000_000;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
    openUrl: () => {},
  };
}

function configContents() {
  return JSON.parse(
    readFileSync(join(tmpHome, ".pruva", "config.json"), "utf8"),
  );
}

describe("runDeviceLogin", () => {
  it("requests a code, polls once, and saves the token on approval", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(deviceCodeBody()))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "pruva_pat_xyz",
          token_type: "bearer",
          expires_in: 3600,
          email: "user@example.com",
        }),
      );

    const clock = fakeClock();
    const result = await runDeviceLogin("https://api.example", clock);

    expect(result.isError).toBeUndefined();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("USER-CODE");
    expect(text).toContain("Authenticated as user@example.com");
    expect(configContents()).toEqual({
      apiUrl: "https://api.example",
      accessToken: "pruva_pat_xyz",
      email: "user@example.com",
    });

    const [codeUrl] = mockFetch.mock.calls[0];
    expect(codeUrl).toBe("https://api.example/api/oauth/device/code");
    const [tokenUrl, tokenInit] = mockFetch.mock.calls[1];
    expect(tokenUrl).toBe("https://api.example/api/oauth/device/token");
    expect(JSON.parse(tokenInit.body)).toEqual({ device_code: "dev-123" });
  });

  it("keeps polling while authorization is pending and succeeds afterwards", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(deviceCodeBody({ interval: 1 })))
      .mockResolvedValueOnce(
        jsonResponse({ error: "authorization_pending" }, 400),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: "authorization_pending" }, 400),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "tok-late",
          token_type: "bearer",
          expires_in: 3600,
        }),
      );

    const result = await runDeviceLogin("https://api.example", fakeClock());
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Authenticated as your account");
    expect(configContents().accessToken).toBe("tok-late");
  });

  it("doubles the interval on slow_down", async () => {
    let sleepCalls: number[] = [];
    let t = 0;
    const deps = {
      now: () => t,
      sleep: async (ms: number) => {
        sleepCalls.push(ms);
        t += ms;
      },
      openUrl: () => {},
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(deviceCodeBody({ interval: 5 })))
      .mockResolvedValueOnce(jsonResponse({ error: "slow_down" }, 400))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "tok",
          token_type: "bearer",
          expires_in: 3600,
        }),
      );

    await runDeviceLogin("https://api.example", deps);

    expect(sleepCalls[0]).toBe(5000);
    expect(sleepCalls[1]).toBe(10000);
  });

  it("reports an expired code without saving a token", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(deviceCodeBody()))
      .mockResolvedValueOnce(jsonResponse({ error: "expired_token" }, 400));

    const result = await runDeviceLogin("https://api.example", fakeClock());
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Code expired");
    expect(() => configContents()).toThrow();
  });

  it("returns a friendly message when the wait window times out", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(deviceCodeBody({ interval: 60 })))
      .mockResolvedValue(
        jsonResponse({ error: "authorization_pending" }, 400),
      );

    const result = await runDeviceLogin("https://api.example", {
      ...fakeClock(),
      maxWaitMs: 100,
    });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Approval not received yet");
    expect(text).toContain("USER-CODE");
    expect(() => configContents()).toThrow();
  });

  it("throws a helpful error if the device-code endpoint fails", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "server_error" }, 500),
    );
    await expect(
      runDeviceLogin("https://api.example", fakeClock()),
    ).rejects.toThrow(/Failed to start device code flow/);
  });
});
