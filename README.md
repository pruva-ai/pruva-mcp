# pruva-mcp

MCP server for [Pruva](https://app.pruva.io) – AI-powered product development platform.

## Installation

Run directly with npx:

```bash
npx pruva-mcp
```

Or install globally:

```bash
npm install -g pruva-mcp
```

## Configuration

Set your API key as an environment variable:

```bash
export PRUVA_API_KEY="your-api-key"
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRUVA_API_KEY` | Yes | — | Your Pruva API key |
| `PRUVA_BASE_URL` | No | `https://app.pruva.io` | Pruva API base URL |
| `PORT` | No | `3100` | Port for HTTP mode |

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pruva": {
      "command": "npx",
      "args": ["-y", "pruva-mcp"],
      "env": {
        "PRUVA_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add pruva -- npx -y pruva-mcp
```

Then set `PRUVA_API_KEY` in your environment.

## HTTP Mode

For remote use, start the server in HTTP mode:

```bash
npx pruva-mcp --http
```

This exposes an `/mcp` endpoint on port 3100 (configurable via `PORT`) and a `/health` endpoint for health checks.

## Available Tools

| Tool | Description |
|---|---|
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
