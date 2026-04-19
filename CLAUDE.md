# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # Compile TypeScript (tsc)
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run dev          # Watch mode TypeScript compilation
npm start            # Run the compiled server (node dist/index.js)
```

Run a single test file:
```bash
npx vitest run src/__tests__/client.test.ts
```

## Architecture

This is an MCP (Model Context Protocol) server that wraps the Pruva product development API. It exposes 13 tools and 5 resource templates over stdio (default) or HTTP (`--http` flag) transport.

### Core flow

`src/index.ts` (entry point) → creates `PruvaClient` → passes it to `createPruvaServer()` → connects transport (stdio or HTTP).

- **`src/client.ts`** — `PruvaClient` has two methods: `.call()` POSTs to `{baseUrl}/api/mcp/data` with an action name and params (for data tools), and `.chat()` POSTs to `{baseUrl}/api/mcp/chat` (for the analysis agent). Both return unwrapped `data` from `{ data: T }` response.
- **`src/server.ts`** — Factory that creates an `McpServer` and registers all tool/resource modules.
- **`src/types.ts`** — Domain types (`Product`, `Feature`, `DocumentMeta`, `DocumentFull`, `SearchResult`, `FeatureRelation`) and the `PruvaAction` union type.

### Tools (`src/tools/`)

Each module exports a `register*Tools(server, client)` function. All tool handlers use `wrapToolHandler()` for error catching and `jsonResult()` for formatting responses. Parameters are validated with Zod schemas.

- `products.ts` — 2 tools (list, get)
- `features.ts` — 4 tools (list, get, create, update)
- `documents.ts` — 5 tools (list, get, create, update, search)
- `relations.ts` — 1 tool (list_feature_relations)
- `chat.ts` — 1 tool (ask)

### Resources (`src/resources/`)

URI-based resource templates (e.g. `pruva://products/{productId}`). Each module exports a `register*Resources(server, client)` function.

### Helpers (`src/tools/helpers.ts`)

- `wrapToolHandler(fn)` — Wraps a tool handler to catch exceptions and return `{ isError: true, content: [...] }` instead of crashing.
- `jsonResult(data)` — Formats any value as a pretty-printed JSON MCP text result.

## Testing

Tests use Vitest with globals enabled. Tool handler tests use the MCP SDK's `InMemoryTransport` to connect a test `Client` to a real `McpServer` with a mocked `PruvaClient`. Client tests mock `global.fetch` via `vi.stubGlobal()`.

Test files live in `src/__tests__/` mirroring the source structure. The vitest config excludes `dist/` to avoid running compiled JS duplicates.

## Environment

Resolves `apiKey` and `baseUrl` from (in order): `PRUVA_API_KEY` / `PRUVA_BASE_URL` env vars, then `~/.pruva/config.json` (shared with `pruva-cli`), then default `baseUrl` `https://app.pruva.io`. Users typically run `pruva config set-key <key>` once; no env var needed in the MCP server config. Optional: `PORT` (default: 3100, HTTP mode only).

See `src/config.ts` for the resolver.
