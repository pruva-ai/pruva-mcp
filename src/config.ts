import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// Shared schema with pruva-cli's src/config.ts — if a new field is added,
// update both resolvers so cross-project reads stay consistent.
export interface Config {
  apiUrl: string;
  accessToken: string;
  email?: string;
}

export const DEFAULT_API_URL = "https://www.pruva.ai";

export function getConfigFilePath(): string {
  return join(homedir(), ".pruva", "config.json");
}

export function readConfigFile(): Partial<Config> | null {
  const path = getConfigFilePath();
  if (!existsSync(path)) return null;
  try {
    const mode = statSync(path).mode & 0o777;
    if ((mode & 0o077) !== 0) {
      const octal = mode.toString(8).padStart(3, "0");
      process.stderr.write(
        `Warning: ${path} has loose permissions (mode ${octal}). Run: chmod 600 ${path}\n`,
      );
    }
    return JSON.parse(readFileSync(path, "utf8")) as Partial<Config>;
  } catch (err) {
    throw new Error(`Invalid config at ${path}: ${(err as Error).message}`);
  }
}

function writeJsonSecure(path: string, data: unknown): void {
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  // mode on writeFileSync only applies on create, not overwrite — enforce explicitly
  chmodSync(tmp, 0o600);
  renameSync(tmp, path);
}

export function writeConfigFile(partial: Partial<Config>): void {
  const path = getConfigFilePath();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  const existing = readConfigFile() ?? {};
  const merged = { ...existing, ...partial };
  writeJsonSecure(path, merged);
}

export interface ResolvedConfig {
  apiUrl: string;
  accessToken: string | null;
  email?: string;
}

/**
 * Resolve the active configuration.
 *
 * - `apiUrl`: PRUVA_API_URL env var > config file > built-in default.
 * - `accessToken`: only from the config file (no env var — keeps secrets out
 *   of process listings). `null` when the user has not logged in.
 *
 * The MCP server always starts even without a token; the `pruva_login` tool
 * is then used to authenticate.
 */
export function resolveConfig(): ResolvedConfig {
  const file = readConfigFile();
  const apiUrl =
    process.env.PRUVA_API_URL ?? file?.apiUrl ?? DEFAULT_API_URL;
  return {
    apiUrl,
    accessToken: file?.accessToken ?? null,
    email: file?.email,
  };
}
