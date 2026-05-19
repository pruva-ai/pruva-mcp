import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError, PruvaClient } from "../client.js";

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
  it("throws NotAuthenticatedError when token is empty", async () => {
    const client = new PruvaClient("https://example.com", "");
    await expect(client.call("list_products")).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends POST to correct URL with bearer token from constructor", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await client.call("list_products");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/data");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer my-secret-key",
    });
  });

  it("strips trailing slashes from apiUrl", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    const client = new PruvaClient("https://example.com///", "my-secret-key");
    await client.call("list_products");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/data");
  });

  it("sends action and params in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: {} }));
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await client.call("get_product", { productId: "abc-123" });

    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      action: "get_product",
      productId: "abc-123",
    });
  });

  it("returns the full envelope on success", async () => {
    const products = [{ id: "1", name: "Product A" }];
    const envelope = { data: products, markdown: "# Products" };
    mockFetch.mockResolvedValue(jsonResponse(envelope));
    const client = new PruvaClient("https://example.com", "my-secret-key");

    const result = await client.call("list_products");
    expect(result).toEqual(envelope);
  });

  it("throws NotAuthenticatedError on 401 from server", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Invalid token" }, 401),
    );
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await expect(client.call("list_products")).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
  });

  it("throws with API error message on non-401 non-OK", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Server exploded" }, 500),
    );
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await expect(client.call("list_products")).rejects.toThrow(
      "Server exploded",
    );
  });

  it("throws generic message when error body is unparseable", async () => {
    mockFetch.mockResolvedValue(
      new Response("<html>Server Error</html>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    );
    const client = new PruvaClient("https://example.com", "my-secret-key");
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

  it("POSTs to /api/mcp/chat with bearer token", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await client.chat({ productId: "p1", message: "hi" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/api/mcp/chat");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer my-secret-key",
    });
  });

  it("returns body.data on success", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: chatData }));
    const client = new PruvaClient("https://example.com", "my-secret-key");

    const result = await client.chat({ productId: "p1", message: "hi" });
    expect(result).toEqual(chatData);
  });

  it("throws NotAuthenticatedError when token is empty", async () => {
    const client = new PruvaClient("https://example.com", "");
    await expect(
      client.chat({ productId: "p1", message: "hi" }),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("throws NotAuthenticatedError on 401", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "no" }, 401));
    const client = new PruvaClient("https://example.com", "my-secret-key");
    await expect(
      client.chat({ productId: "p1", message: "hi" }),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});
