import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveConfig (mcp)", () => {
  let tmpHome: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), "pruva-mcp-cfg-"));
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
    delete process.env.PRUVA_API_URL;
  });

  afterEach(() => {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    rmSync(tmpHome, { recursive: true, force: true });
  });

  it("returns a null token and default URL when no config or env is set", async () => {
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig()).toEqual({
      apiUrl: "https://www.pruva.ai",
      accessToken: null,
      email: undefined,
    });
  });

  it("reads token and apiUrl from ~/.pruva/config.json", async () => {
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    writeFileSync(
      join(tmpHome, ".pruva", "config.json"),
      JSON.stringify({
        apiUrl: "https://staging.pruva.ai",
        accessToken: "pruva_pat_abc",
        email: "user@example.com",
      }),
    );
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig()).toEqual({
      apiUrl: "https://staging.pruva.ai",
      accessToken: "pruva_pat_abc",
      email: "user@example.com",
    });
  });

  it("PRUVA_API_URL env beats the file's apiUrl", async () => {
    process.env.PRUVA_API_URL = "https://override.example";
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    writeFileSync(
      join(tmpHome, ".pruva", "config.json"),
      JSON.stringify({ apiUrl: "https://file.example", accessToken: "tok" }),
    );
    const { resolveConfig } = await import("../config.js");
    const cfg = resolveConfig();
    expect(cfg.apiUrl).toBe("https://override.example");
    expect(cfg.accessToken).toBe("tok");
  });

  it("warns on loose file permissions but still returns the token", async () => {
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    const cfgPath = join(tmpHome, ".pruva", "config.json");
    writeFileSync(cfgPath, JSON.stringify({ accessToken: "tok_loose" }));
    chmodSync(cfgPath, 0o644);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig().accessToken).toBe("tok_loose");
    const warnings = stderrSpy.mock.calls
      .map((c) => String(c[0]))
      .filter((s) => s.includes("loose permissions"));
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("mode 644");
    expect(warnings[0]).toContain("chmod 600");
    stderrSpy.mockRestore();
  });

  it("does not warn when file is 0600", async () => {
    mkdirSync(join(tmpHome, ".pruva"), { recursive: true });
    const cfgPath = join(tmpHome, ".pruva", "config.json");
    writeFileSync(cfgPath, JSON.stringify({ accessToken: "tok_tight" }));
    chmodSync(cfgPath, 0o600);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const { resolveConfig } = await import("../config.js");
    expect(resolveConfig().accessToken).toBe("tok_tight");
    const warnings = stderrSpy.mock.calls
      .map((c) => String(c[0]))
      .filter((s) => s.includes("loose permissions"));
    expect(warnings.length).toBe(0);
    stderrSpy.mockRestore();
  });
});

describe("writeConfigFile", () => {
  let tmpHome: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), "pruva-mcp-cfg-write-"));
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
  });

  afterEach(() => {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    rmSync(tmpHome, { recursive: true, force: true });
  });

  it("creates ~/.pruva with 0700 and writes file with 0600", async () => {
    const { writeConfigFile, getConfigFilePath } = await import("../config.js");
    writeConfigFile({ apiUrl: "https://x", accessToken: "tok" });
    const path = getConfigFilePath();
    const contents = JSON.parse(readFileSync(path, "utf8"));
    expect(contents).toEqual({ apiUrl: "https://x", accessToken: "tok" });
    const fileMode = statSync(path).mode & 0o777;
    expect(fileMode).toBe(0o600);
    const dirMode = statSync(join(tmpHome, ".pruva")).mode & 0o777;
    expect(dirMode).toBe(0o700);
  });

  it("merges with existing config rather than overwriting", async () => {
    const { writeConfigFile } = await import("../config.js");
    writeConfigFile({ apiUrl: "https://a", accessToken: "old" });
    writeConfigFile({ accessToken: "new" });
    const contents = JSON.parse(
      readFileSync(join(tmpHome, ".pruva", "config.json"), "utf8"),
    );
    expect(contents).toEqual({ apiUrl: "https://a", accessToken: "new" });
  });
});
