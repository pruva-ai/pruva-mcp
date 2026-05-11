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
  const server = createPruvaServer(mockPruvaClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
});

beforeEach(() => {
  mockCall.mockReset();
});

describe("pruva_list_products", () => {
  it("calls client.call with correct action", async () => {
    const products = [
      {
        id: "p1",
        name: "Product A",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    ];
    mockCall.mockResolvedValue(envelope(products, "# Products\n\n## Product A"));

    await client.callTool({ name: "pruva_list_products", arguments: {} });

    expect(mockCall).toHaveBeenCalledWith("list_products");
  });

  it("returns the server-rendered markdown body", async () => {
    const md = "# Products\n\n## Product A";
    mockCall.mockResolvedValue(envelope([{ id: "p1" }], md));

    const result = await client.callTool({
      name: "pruva_list_products",
      arguments: {},
    });

    expect(result.content).toEqual([{ type: "text", text: md }]);
  });
});

describe("pruva_get_product", () => {
  it("calls client.call with correct action and params", async () => {
    mockCall.mockResolvedValue(
      envelope({
        id: "p1",
        name: "Product A",
        feature_count: 3,
        document_count: 5,
      }),
    );

    await client.callTool({
      name: "pruva_get_product",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_product", { productId: "p1" });
  });

  it("returns the server-rendered markdown body", async () => {
    const md = "# Product A\n\nFeatures: 3\nDocuments: 5";
    mockCall.mockResolvedValue(envelope({ id: "p1" }, md));

    const result = await client.callTool({
      name: "pruva_get_product",
      arguments: { productId: "p1" },
    });

    expect(result.content).toEqual([{ type: "text", text: md }]);
  });

  it("returns error on API failure", async () => {
    mockCall.mockRejectedValue(new Error("Not found"));

    const result = await client.callTool({
      name: "pruva_get_product",
      arguments: { productId: "bad-id" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "Not found" }]);
  });
});
