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

  it("returns slug-based feature summaries", async () => {
    const features = [
      { slug: "auth", title: "Authentication", content: "title: Authentication\n" },
    ];
    mockCall.mockResolvedValue(features);

    const result = await client.callTool({
      name: "pruva_list_features",
      arguments: { productId: "p1" },
    });

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(features, null, 2) },
    ]);
  });
});

describe("pruva_get_feature", () => {
  it("sends productId and slug", async () => {
    mockCall.mockResolvedValue({
      slug: "auth",
      title: "Auth",
      content: "title: Auth\n",
      wireframes: {},
    });

    await client.callTool({
      name: "pruva_get_feature",
      arguments: { productId: "p1", slug: "auth" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_feature", {
      productId: "p1",
      slug: "auth",
    });
  });
});

describe("pruva_create_feature", () => {
  it("sends productId, slug, title, and content", async () => {
    mockCall.mockResolvedValue({
      slug: "auth",
      title: "Auth",
      content: "title: Auth\n",
    });

    await client.callTool({
      name: "pruva_create_feature",
      arguments: {
        productId: "p1",
        slug: "auth",
        title: "Auth",
        content: "title: Auth\n",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("create_feature", {
      productId: "p1",
      slug: "auth",
      title: "Auth",
      content: "title: Auth\n",
    });
  });

  it("sends undefined content when not provided", async () => {
    mockCall.mockResolvedValue({
      slug: "auth",
      title: "Auth",
      content: "title: Auth\n",
    });

    await client.callTool({
      name: "pruva_create_feature",
      arguments: { productId: "p1", slug: "auth", title: "Auth" },
    });

    expect(mockCall).toHaveBeenCalledWith("create_feature", {
      productId: "p1",
      slug: "auth",
      title: "Auth",
      content: undefined,
    });
  });
});

describe("pruva_update_feature", () => {
  it("sends productId, slug, and content", async () => {
    mockCall.mockResolvedValue({ slug: "auth", content: "title: Updated\n" });

    await client.callTool({
      name: "pruva_update_feature",
      arguments: {
        productId: "p1",
        slug: "auth",
        content: "title: Updated\n",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("update_feature", {
      productId: "p1",
      slug: "auth",
      content: "title: Updated\n",
    });
  });

  it("returns isError on API failure", async () => {
    mockCall.mockRejectedValue(new Error("Forbidden"));

    const result = await client.callTool({
      name: "pruva_update_feature",
      arguments: { productId: "p1", slug: "auth", content: "x" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "Forbidden" }]);
  });
});
