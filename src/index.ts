#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { PruvaClient } from "./client.js";
import { resolveConfig } from "./config.js";
import { createPruvaServer } from "./server.js";

// ── Configuration ─────────────────────────────────────────────

let apiKey: string;
let baseUrl: string;
try {
  ({ apiKey, baseUrl } = resolveConfig());
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(1);
}
const port = parseInt(process.env.PORT || "3100", 10);
const useHttp = process.argv.includes("--http");

// ── Bootstrap ─────────────────────────────────────────────────

const client = new PruvaClient(apiKey, baseUrl);
const server = createPruvaServer(client);

if (useHttp) {
  // HTTP transport — for remote use
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
  // stdio transport — for Claude Code / local IDE use (default)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pruva MCP server running on stdio");
}
