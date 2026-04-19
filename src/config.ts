import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Shared schema with pruva-cli's src/config.ts — if a new field is added,
// update both resolvers so cross-project reads stay consistent.
export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
}

const DEFAULT_BASE_URL = "https://app.pruva.io";

function readConfigFile(): Partial<ResolvedConfig> | null {
  const path = join(homedir(), ".pruva", "config.json");
  if (!existsSync(path)) return null;
  try {
    const mode = statSync(path).mode & 0o777;
    if ((mode & 0o077) !== 0) {
      const octal = mode.toString(8).padStart(3, "0");
      process.stderr.write(
        `Warning: ~/.pruva/config.json has loose permissions (mode ${octal}). Run: chmod 600 ${path}\n`,
      );
    }
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`Invalid config at ${path}: ${(err as Error).message}`);
  }
}

export function resolveConfig(): ResolvedConfig {
  const file = readConfigFile();
  const apiKey = process.env.PRUVA_API_KEY ?? file?.apiKey;
  if (!apiKey) {
    throw new Error(
      "No API key found. Run 'pruva config set-key <key>' or set the PRUVA_API_KEY env var.",
    );
  }
  const baseUrl =
    process.env.PRUVA_BASE_URL ?? file?.baseUrl ?? DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
}
