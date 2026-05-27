# pruva-mcp

[![license](https://img.shields.io/npm/l/pruva-mcp.svg)](./LICENSE)

[Pruva](https://www.pruva.ai) is an AI-powered product development platform that helps teams define products, craft features, and generate specs with AI agents. The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets LLM clients connect to external tools and data sources.

This repo hosts Pruva's **remote MCP server**. Clients connect over HTTPS — no local install, no API keys to copy around. Authentication is handled by your MCP client via OAuth against the Pruva backend.

> Looking for a local CLI? See [`pruva-cli`](https://github.com/pruva-ai/pruva-cli).

## Endpoint

```
https://mcp.pruva.ai/api/mcp
```

Streamable HTTP transport. Legacy SSE clients can use `https://mcp.pruva.ai/api/sse`.

## Usage with Claude Code

```bash
claude mcp add --transport http pruva https://mcp.pruva.ai/api/mcp
```

The first tool call triggers OAuth in your browser. Subsequent calls reuse the stored token.

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pruva": {
      "type": "http",
      "url": "https://mcp.pruva.ai/api/mcp"
    }
  }
}
```

## Usage with Cursor

Add to your `.cursor/mcp.json` (project-level) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "pruva": {
      "url": "https://mcp.pruva.ai/api/mcp"
    }
  }
}
```

## Usage with other MCP clients

Any MCP client that supports the Streamable HTTP transport with OAuth 2.1 / Bearer auth works. Point it at `https://mcp.pruva.ai/api/mcp` — the protected-resource metadata at `/.well-known/oauth-protected-resource` advertises the authorization server.

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

## Links

- [Pruva](https://www.pruva.ai) — the product development platform
- [pruva-cli](https://github.com/pruva-ai/pruva-cli) — companion command-line tool
- [Model Context Protocol](https://modelcontextprotocol.io) — the open standard this server implements

## Contributing & Issues

Bug reports, feature requests, and pull requests are welcome on [GitHub Issues](https://github.com/pruva-ai/pruva-mcp/issues).

## License

MIT
