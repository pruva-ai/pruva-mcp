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

describe("pruva_get_feature_relations", () => {
  it("sends correct action and productId", async () => {
    const relations = [
      {
        source_slug: "auth",
        target_slug: "profile",
        relation_type: "depends_on",
        context: "Profile editing requires authentication",
      },
    ];
    mockCall.mockResolvedValue(relations);

    const result = await client.callTool({
      name: "pruva_get_feature_relations",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_feature_relations", {
      productId: "p1",
    });
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(relations, null, 2) },
    ]);
  });
});
