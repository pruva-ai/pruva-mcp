# pruva-mcp

MCP server for [Pruva](https://www.pruva.ai) – AI-powered product development platform.

## Installation

Run directly with npx:

```bash
npx pruva-mcp
```

Or install globally:

```bash
npm install -g pruva-mcp
```

## Authentication

The server uses an interactive OAuth flow — no API keys to manage. After adding the server to your MCP client, call the `pruva_login` tool once. It returns a URL you open in your browser to approve access, then writes the resulting token to `~/.pruva/config.json` (shared with the `pruva-cli`).

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRUVA_API_URL` | No | `https://www.pruva.ai` | API URL override (e.g. for staging). |
| `PORT` | No | `3100` | Port for HTTP mode. |

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

## License

MIT
