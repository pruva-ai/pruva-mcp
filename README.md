# pruva-mcp

[![npm version](https://img.shields.io/npm/v/pruva-mcp.svg)](https://www.npmjs.com/package/pruva-mcp)
[![npm downloads](https://img.shields.io/npm/dm/pruva-mcp.svg)](https://www.npmjs.com/package/pruva-mcp)
[![license](https://img.shields.io/npm/l/pruva-mcp.svg)](./LICENSE)

[Pruva](https://www.pruva.ai) is an AI-powered product development platform that helps teams define products, craft features, and generate specs with AI agents. The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets LLM clients connect to external tools and data sources. This MCP server gives Claude, Cursor, and other MCP-compatible clients direct access to your Pruva products, features, and documents — so you can read, search, and edit your product knowledge base right from your chat or editor.

## Quick Start

1. Add the server to your MCP client (see snippets below).
2. Ask your assistant to call the `pruva_login` tool — it opens a browser for one-time approval and stores the token in `~/.pruva/config.json` (shared with [`pruva-cli`](https://github.com/pruva-ai/pruva-cli)).
3. Start asking questions like *"list my Pruva products"* or *"summarize the latest spec for product X"*.

```bash
npx pruva-mcp
```

Or install globally:

```bash
npm install -g pruva-mcp
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pruva": {
      "command": "npx",
      "args": ["-y", "pruva-mcp"]
    }
  }
}
```

Then ask Claude to call the `pruva_login` tool to authenticate.

## Usage with Claude Code

```bash
claude mcp add pruva -- npx -y pruva-mcp
```

Then call the `pruva_login` tool from within Claude Code to authenticate.

## Usage with Cursor

Add to your `.cursor/mcp.json` (project-level) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "pruva": {
      "command": "npx",
      "args": ["-y", "pruva-mcp"]
    }
  }
}
```

Restart Cursor and call `pruva_login` from the chat to authenticate.

## Usage with other MCP clients

Any MCP client that supports stdio transports works — point it at the `npx -y pruva-mcp` command (or the globally installed `pruva-mcp` binary). The server speaks plain MCP over stdio with no extra setup.

## Authentication

The server uses an interactive OAuth flow — no API keys to manage. After adding the server to your MCP client, call the `pruva_login` tool once. It returns a URL you open in your browser to approve access, then writes the resulting token to `~/.pruva/config.json` (shared with `pruva-cli`).

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRUVA_API_URL` | No | `https://www.pruva.ai` | API URL override (e.g. for staging). |
| `PORT` | No | `3100` | Port for HTTP mode. |

## HTTP Mode

For remote use, start the server in HTTP mode:

```bash
npx pruva-mcp --http
```

This exposes an `/mcp` endpoint on port 3100 (configurable via `PORT`) and a `/health` endpoint for health checks.

## Available Tools

| Tool | Description |
|---|---|
| `pruva_login` | Authenticate via OAuth device code flow. Call once before using other tools. |
| `pruva_list_products` | List all active products in your Pruva workspace |
| `pruva_get_product` | Get details of a specific product |
| `pruva_list_features` | List all features for a product |
| `pruva_get_feature` | Get details of a specific feature |
| `pruva_create_feature` | Create a new feature within a product |
| `pruva_update_feature` | Update a feature's title or status |
| `pruva_list_documents` | List documents for a product, optionally filtered by type or feature |
| `pruva_get_document` | Get a document's full content and metadata |
| `pruva_create_document` | Create a new document within a product |
| `pruva_update_document` | Update a document's content or path |
| `pruva_search_documents` | Search documents by content within a product |
| `pruva_list_feature_relations` | List all feature relations for a product |
| `pruva_ask` | Ask the Pruva analysis agent a read-only question about a product |

## Available Resources

| URI Template | Description |
|---|---|
| `pruva://products/{productId}` | Product details |
| `pruva://products/{productId}/features` | Features list for a product |
| `pruva://products/{productId}/relations` | Feature relations for a product |
| `pruva://products/{productId}/documents` | Documents list for a product |
| `pruva://documents/{documentId}` | Single document content |

## Links

- [Pruva](https://www.pruva.ai) — the product development platform
- [pruva-cli](https://github.com/pruva-ai/pruva-cli) — companion command-line tool (shares the same auth token)
- [Model Context Protocol](https://modelcontextprotocol.io) — the open standard this server implements

## Contributing & Issues

Bug reports, feature requests, and pull requests are welcome on [GitHub Issues](https://github.com/pruva-ai/pruva-mcp/issues).

## License

MIT
