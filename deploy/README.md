# pruva-mcp deploy

Vercel-hostable Next.js wrapper that re-exposes the parent `pruva-mcp` tools
as a remote MCP server over HTTPS.

## How it works

- Mounted at `app/api/[transport]/route.ts` — serves `/api/mcp` (Streamable HTTP)
  and `/api/sse` (legacy SSE) using `@vercel/mcp-adapter`.
- Per request: extracts `Authorization: Bearer <token>` → builds a fresh
  `PruvaClient(token)` → tool calls forward to the Pruva backend's
  `/api/mcp/data` endpoint, which re-validates the token.
- No database or other infra is wired here. Token validation lives entirely on
  the Pruva backend.

## Local dev

```bash
# 1. Build the parent pruva-mcp package
cd ..
npm install
npm run build

# 2. Install deploy deps
cd deploy
npm install

# 3. Point at a running Pruva app
export PRUVA_API_URL=http://localhost:3000  # or omit for https://www.pruva.ai

# 4. Start the dev server (port 3100)
npm run dev
```

## Env vars

- `PRUVA_API_URL` — defaults to `https://www.pruva.ai`. Set to
  `http://localhost:3000` to point at a local Pruva app.

## Smoke tests

```bash
# Landing page
curl http://localhost:3100/

# MCP endpoint without auth → 401
curl -i -X POST http://localhost:3100/api/mcp

# MCP initialize with a real Pruva PAT
curl -X POST http://localhost:3100/api/mcp \
  -H "Authorization: Bearer pmcp_..." \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## Deploy to Vercel

- Project root: `pruva-mcp/deploy/`
- Suggested domain: `mcp.pruva.ai`
- No env vars are required for production (defaults to `https://www.pruva.ai`).

The parent `pruva-mcp` source is imported via relative paths
(`../src/...`) with Next's `experimental.externalDir`, so Vercel does NOT need
the parent `dist/` to be built — Next compiles the parent TypeScript inline.
