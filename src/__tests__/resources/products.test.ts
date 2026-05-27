import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { PruvaClient } from "../../client.js";
import { createPruvaServer } from "../../server.js";

let mockCall: ReturnType<typeof vi.fn>;
let client: Client;

function envelope<T>(data: T, markdown = "# md") {
  return { data, markdown };
}

beforeAll(async () => {
  mockCall = vi.fn();
  const mockPruvaClient = { call: mockCall } as unknown as PruvaClient;
  const server = createPruvaServer(() => mockPruvaClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
});

beforeEach(() => {
  mockCall.mockReset();
});

const productList = [
  {
    id: "p1",
    name: "Product A",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "p2",
    name: "Product B",
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-04T00:00:00Z",
  },
];

describe("resource: product (pruva://products/{productId})", () => {
  it("reads product detail markdown", async () => {
    mockCall.mockResolvedValue(envelope({ id: "p1" }, "# Product A"));
    const res = await client.readResource({ uri: "pruva://products/p1" });
    expect(mockCall).toHaveBeenCalledWith("get_product", { productId: "p1" });
    expect(res.contents).toEqual([
      {
        uri: "pruva://products/p1",
        mimeType: "text/markdown",
        text: "# Product A",
      },
    ]);
  });

  it("lists product resources", async () => {
    mockCall.mockResolvedValue(envelope(productList));
    const res = await client.listResources();
    const productUris = res.resources.filter((r) =>
      /^pruva:\/\/products\/[^/]+$/.test(r.uri),
    );
    expect(productUris).toEqual([
      {
        uri: "pruva://products/p1",
        name: "Product A",
        mimeType: "text/markdown",
      },
      {
        uri: "pruva://products/p2",
        name: "Product B",
        mimeType: "text/markdown",
      },
    ]);
  });
});

describe("resource: product-features (pruva://products/{productId}/features)", () => {
  it("reads features markdown", async () => {
    mockCall.mockResolvedValue(envelope([], "# Features"));
    const res = await client.readResource({
      uri: "pruva://products/p1/features",
    });
    expect(mockCall).toHaveBeenCalledWith("list_features", { productId: "p1" });
    expect(res.contents[0]).toMatchObject({
      uri: "pruva://products/p1/features",
      text: "# Features",
    });
  });

  it("lists features resources for each product", async () => {
    mockCall.mockResolvedValue(envelope(productList));
    const res = await client.listResources();
    const uris = res.resources.filter((r) => r.uri.endsWith("/features"));
    expect(uris).toEqual([
      {
        uri: "pruva://products/p1/features",
        name: "Product A — Features",
        mimeType: "text/markdown",
      },
      {
        uri: "pruva://products/p2/features",
        name: "Product B — Features",
        mimeType: "text/markdown",
      },
    ]);
  });
});

describe("resource: product-relations (pruva://products/{productId}/relations)", () => {
  it("reads relations markdown", async () => {
    mockCall.mockResolvedValue(envelope([], "# Relations"));
    const res = await client.readResource({
      uri: "pruva://products/p1/relations",
    });
    expect(mockCall).toHaveBeenCalledWith("list_feature_relations", {
      productId: "p1",
    });
    expect(res.contents[0]).toMatchObject({
      uri: "pruva://products/p1/relations",
      text: "# Relations",
    });
  });

  it("lists relations resources for each product", async () => {
    mockCall.mockResolvedValue(envelope(productList));
    const res = await client.listResources();
    const uris = res.resources.filter((r) => r.uri.endsWith("/relations"));
    expect(uris).toEqual([
      {
        uri: "pruva://products/p1/relations",
        name: "Product A — Feature Relations",
        mimeType: "text/markdown",
      },
      {
        uri: "pruva://products/p2/relations",
        name: "Product B — Feature Relations",
        mimeType: "text/markdown",
      },
    ]);
  });
});
