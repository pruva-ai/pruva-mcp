import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("resolveConfig (mcp)", () => {
  let tmpHome: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), "pruva-mcp-cfg-"));
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
    delete process.env.PRUVA_API_KEY;
    delete process.env.PRUVA_BASE_URL;
  });

  afterEach(() => {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    rmSync(tmpHome, { recursive: true, force: true });
  });

  it("throws when neither env nor file has apiKey", async () => {
    const { resolveConfig } = await import("../config.js");
    expect(() => resolveConfig()).toThrow(/No API key found/);
  });

  it("uses env when set", async () => {
    process.env.PRUVA_API_KEY = "pk_env";
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig()).toEqual({
      apiKey: "pk_env",
      baseUrl: "https://app.pruva.io",
    });
  });

  it("falls back to ~/.pruva/config.json", async () => {
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    writeFileSync(
      join(tmpHome, ".pruva", "config.json"),
      JSON.stringify({ apiKey: "pk_file", baseUrl: "https://x" }),
    );
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig()).toEqual({ apiKey: "pk_file", baseUrl: "https://x" });
  });

  it("env beats file", async () => {
    process.env.PRUVA_API_KEY = "pk_env";
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    writeFileSync(
      join(tmpHome, ".pruva", "config.json"),
      JSON.stringify({ apiKey: "pk_file" }),
    );
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig().apiKey).toBe("pk_env");
  });

  it("default baseUrl when nothing set", async () => {
    process.env.PRUVA_API_KEY = "pk_x";
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig().baseUrl).toBe("https://app.pruva.io");
  });
});
