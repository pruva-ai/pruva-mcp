# pruva-mcp

[![license](https://img.shields.io/npm/l/pruva-mcp.svg)](./LICENSE)

Remote [Model Context Protocol](https://modelcontextprotocol.io) server for [Pruva](https://www.pruva.ai). Connect your AI assistant to your Pruva products, features, and documents over HTTPS — no install, no API keys.

## Endpoint

```
https://mcp.pruva.ai/api/mcp
```

Authentication is handled by your MCP client over OAuth 2.1 against the Pruva backend. The first tool call opens a browser tab where you approve access; the token is then stored by your client and reused.

## Setup

### Claude Code

```bash
claude mcp add --transport http pruva https://mcp.pruva.ai/api/mcp
```

### Claude Desktop

In `claude_desktop_config.json`:

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

### Cursor

In `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "pruva": {
      "url": "https://mcp.pruva.ai/api/mcp"
    }
  }
}
```

### Other clients

Any MCP client that speaks Streamable HTTP with OAuth 2.1 works. Point it at the endpoint — discovery happens automatically via `/.well-known/oauth-protected-resource`.

## Tools

| Tool | Purpose |
|---|---|
| `pruva_list_products` | List your products |
| `pruva_get_product` | Get a product's details |
| `pruva_list_features` | List a product's features |
| `pruva_get_feature` | Get a feature's details |
| `pruva_create_feature` | Create a feature |
| `pruva_update_feature` | Update a feature's title or status |
| `pruva_list_documents` | List a product's documents |
| `pruva_get_document` | Get a document's content |
| `pruva_create_document` | Create a document |
| `pruva_update_document` | Update a document's content or path |
| `pruva_search_documents` | Search documents by content |
| `pruva_list_feature_relations` | List feature relations |
| `pruva_ask` | Ask the Pruva analysis agent a read-only question |

## Resources

| URI Template | Returns |
|---|---|
| `pruva://products/{productId}` | Product details |
| `pruva://products/{productId}/features` | Features list |
| `pruva://products/{productId}/relations` | Feature relations |
| `pruva://products/{productId}/documents` | Documents list |
| `pruva://products/{productId}/documents/{path}` | Single document content |

## Security

- No long-lived secrets to manage — auth runs through the standard OAuth flow in your browser.
- Tokens are stored by your MCP client, not by this server.
- Every API call is re-validated against the Pruva backend.
- Revoke access any time from your Pruva account settings.

## Links

- [Pruva](https://www.pruva.ai)
- [pruva-cli](https://github.com/pruva-ai/pruva-cli) — terminal companion
- [Model Context Protocol](https://modelcontextprotocol.io)

## Issues

[GitHub Issues](https://github.com/pruva-ai/pruva-mcp/issues)

## License

MIT
