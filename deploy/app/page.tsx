export default function Home() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        maxWidth: 720,
        margin: "0 auto",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Pruva MCP Server</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Remote Model Context Protocol endpoint for Pruva.
      </p>

      <h2>Endpoint</h2>
      <p>
        Connect your MCP client to <code>/api/mcp</code> using Streamable HTTP
        transport. Authenticate with a Bearer token in the{" "}
        <code>Authorization</code> header.
      </p>

      <h2>Getting a token</h2>
      <p>
        Create a personal access token at{" "}
        <a href="https://www.pruva.ai/dashboard">pruva.ai/dashboard</a>.
      </p>

      <h2>Docs</h2>
      <p>
        See <a href="https://docs.pruva.ai">docs.pruva.ai</a> for client setup
        examples.
      </p>
    </main>
  );
}
