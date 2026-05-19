#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { PruvaClient } from "./client.js";
import type { ClientProvider } from "./client-provider.js";
import { resolveConfig } from "./config.js";
import { createPruvaServer, createPruvaServerWithProvider } from "./server.js";

// ── Configuration ─────────────────────────────────────────────

const port = parseInt(process.env.PORT || "3100", 10);
const useHttp = process.argv.includes("--http");

// ── Bootstrap ─────────────────────────────────────────────────

if (useHttp) {
  // Multi-tenant per-request auth is handled by the Vercel deploy wrapper (pruva-mcp-server). This standalone HTTP mode is single-tenant via env vars.
  const apiUrl = process.env.PRUVA_API_URL ?? "https://www.pruva.ai";
  const accessToken = process.env.PRUVA_ACCESS_TOKEN ?? "";
  const client = new PruvaClient(apiUrl, accessToken);
  const server = createPruvaServer(client, { mode: "http" });

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    if (url.pathname === "/mcp") {
      await transport.handleRequest(req, res);
    } else if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await server.connect(transport);
  httpServer.listen(port, () => {
    console.error(`Pruva MCP server (HTTP) listening on http://localhost:${port}/mcp`);
  });
} else {
  // stdio transport — for Claude Code / local IDE use (default).
  // Boot even without a token; the user can run `pruva_login` to populate it.
  // Provider re-reads config on each call so a fresh token from `pruva_login`
  // takes effect immediately without restarting the server.
  const provider: ClientProvider = () => {
    const resolved = resolveConfig();
    return new PruvaClient(resolved.apiUrl, resolved.accessToken ?? "");
  };
  const server = createPruvaServerWithProvider(provider, { mode: "stdio" });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pruva MCP server running on stdio");
}
