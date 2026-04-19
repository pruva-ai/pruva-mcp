import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
}

const DEFAULT_BASE_URL = "https://app.pruva.io";

function readConfigFile(): { apiKey?: string; baseUrl?: string } | null {
  const path = join(homedir(), ".pruva", "config.json");
  if (!existsSync(path)) return null;
  try {
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
