import { PruvaClient } from "../client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("PruvaClient", () => {
  it("sends POST to correct URL", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    const client = new PruvaClient("key", "https://example.com");
    await client.call("list_products");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/data");
    expect(init.method).toBe("POST");
  });

  it("strips trailing slashes from baseUrl", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    const client = new PruvaClient("key", "https://example.com///");
    await client.call("list_products");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/data");
  });

  it("sends correct headers", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: null }));
    const client = new PruvaClient("my-secret-key", "https://example.com");
    await client.call("list_products");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer my-secret-key",
    });
  });

  it("sends action and params in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: {} }));
    const client = new PruvaClient("key", "https://example.com");
    await client.call("get_product", { productId: "abc-123" });

    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      action: "get_product",
      productId: "abc-123",
    });
  });

  it("passes empty params by default", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    const client = new PruvaClient("key", "https://example.com");
    await client.call("list_products");

    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ action: "list_products" });
  });

  it("returns body.data on success", async () => {
    const products = [{ id: "1", name: "Product A" }];
    mockFetch.mockResolvedValue(jsonResponse({ data: products }));
    const client = new PruvaClient("key", "https://example.com");

    const result = await client.call("list_products");
    expect(result).toEqual(products);
  });

  it("throws with API error message on non-OK response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Invalid API key" }, 401),
    );
    const client = new PruvaClient("bad-key", "https://example.com");

    await expect(client.call("list_products")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws generic message when error body is unparseable", async () => {
    mockFetch.mockResolvedValue(
      new Response("<html>Server Error</html>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    );
    const client = new PruvaClient("key", "https://example.com");

    await expect(client.call("list_products")).rejects.toThrow(
      "Pruva API error (500)",
    );
  });
});

describe("PruvaClient.chat", () => {
  const chatData = {
    reply: "Hi there",
    usage: { input_tokens: 10, output_tokens: 5 },
  };

  it("POSTs to /api/mcp/chat", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("key", "https://example.com");
    await client.chat({ productId: "p1", message: "hi" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/chat");
    expect(init.method).toBe("POST");
  });

  it("sends Bearer auth header", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("my-secret-key", "https://example.com");
    await client.chat({ productId: "p1", message: "hi" });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer my-secret-key",
    });
  });

  it("sends full request body including optional fields", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("key", "https://example.com");
    const history = [{ role: "user" as const, content: "earlier" }];
    await client.chat({
      productId: "p1",
      message: "now",
      history,
      featureSlug: "x",
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      productId: "p1",
      message: "now",
      history,
      featureSlug: "x",
    });
  });

  it("returns body.data on success", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("key", "https://example.com");

    const result = await client.chat({ productId: "p1", message: "hi" });
    expect(result).toEqual(chatData);
  });

  it("throws with API error message on non-OK response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Product not found" }, 404),
    );
    const client = new PruvaClient("key", "https://example.com");

    await expect(
      client.chat({ productId: "missing", message: "hi" }),
    ).rejects.toThrow("Product not found");
  });

  it("throws generic message when error body is unparseable", async () => {
    mockFetch.mockResolvedValue(
      new Response("<html>boom</html>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    );
    const client = new PruvaClient("key", "https://example.com");

    await expect(
      client.chat({ productId: "p1", message: "hi" }),
    ).rejects.toThrow("Pruva API error (500)");
  });
});
