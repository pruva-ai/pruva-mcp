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

describe("pruva_list_features", () => {
  it("sends correct action and productId", async () => {
    mockCall.mockResolvedValue([]);

    await client.callTool({
      name: "pruva_list_features",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("list_features", {
      productId: "p1",
    });
  });
});

describe("pruva_get_feature", () => {
  it("sends correct action and featureId", async () => {
    mockCall.mockResolvedValue({ id: "f1" });

    await client.callTool({
      name: "pruva_get_feature",
      arguments: { featureId: "f1" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_feature", { featureId: "f1" });
  });
});

describe("pruva_create_feature", () => {
  it("sends productId, title, and brief", async () => {
    mockCall.mockResolvedValue({ id: "f-new" });

    await client.callTool({
      name: "pruva_create_feature",
      arguments: {
        productId: "p1",
        title: "Auth",
        brief: "User authentication",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("create_feature", {
      productId: "p1",
      title: "Auth",
      brief: "User authentication",
    });
  });

  it("sends undefined brief when not provided", async () => {
    mockCall.mockResolvedValue({ id: "f-new" });

    await client.callTool({
      name: "pruva_create_feature",
      arguments: { productId: "p1", title: "Auth" },
    });

    expect(mockCall).toHaveBeenCalledWith("create_feature", {
      productId: "p1",
      title: "Auth",
      brief: undefined,
    });
  });
});

describe("pruva_update_feature", () => {
  it("sends featureId and optional fields", async () => {
    mockCall.mockResolvedValue({ id: "f1" });

    await client.callTool({
      name: "pruva_update_feature",
      arguments: { featureId: "f1", title: "New Title", status: "done" },
    });

    expect(mockCall).toHaveBeenCalledWith("update_feature", {
      featureId: "f1",
      title: "New Title",
      status: "done",
    });
  });

  it("returns isError on API failure", async () => {
    mockCall.mockRejectedValue(new Error("Forbidden"));

    const result = await client.callTool({
      name: "pruva_update_feature",
      arguments: { featureId: "f1" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Forbidden" },
    ]);
  });
});
