import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { PruvaClient } from "../../client.js";
import { createPruvaServer } from "../../server.js";

let mockCall: ReturnType<typeof vi.fn>;
let client: Client;

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
    const products = [{ id: "p1", name: "Product A" }];
    mockCall.mockResolvedValue(products);

    await client.callTool({ name: "pruva_list_products", arguments: {} });

    expect(mockCall).toHaveBeenCalledWith("list_products");
  });

  it("returns product list as formatted JSON", async () => {
    const products = [{ id: "p1", name: "Product A" }];
    mockCall.mockResolvedValue(products);

    const result = await client.callTool({
      name: "pruva_list_products",
      arguments: {},
    });

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(products, null, 2) },
    ]);
  });
});

describe("pruva_get_product", () => {
  it("calls client.call with correct action and params", async () => {
    mockCall.mockResolvedValue({ id: "p1", name: "Product A" });

    await client.callTool({
      name: "pruva_get_product",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_product", { productId: "p1" });
  });

  it("returns error on API failure", async () => {
    mockCall.mockRejectedValue(new Error("Not found"));

    const result = await client.callTool({
      name: "pruva_get_product",
      arguments: { productId: "bad-id" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Not found" },
    ]);
  });
});
