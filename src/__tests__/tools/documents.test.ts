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

describe("pruva_list_documents", () => {
  it("sends productId", async () => {
    mockCall.mockResolvedValue([
      { path: "overview.md", content_preview: "# Overview" },
    ]);

    await client.callTool({
      name: "pruva_list_documents",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("list_documents", {
      productId: "p1",
    });
  });
});

describe("pruva_get_document", () => {
  it("sends productId and path", async () => {
    mockCall.mockResolvedValue({ path: "overview.md", content: "# Overview" });

    await client.callTool({
      name: "pruva_get_document",
      arguments: { productId: "p1", path: "overview.md" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_document", {
      productId: "p1",
      path: "overview.md",
    });
  });
});

describe("pruva_create_document", () => {
  it("sends productId, path, and content", async () => {
    mockCall.mockResolvedValue({ path: "prd.md", content: "# PRD" });

    await client.callTool({
      name: "pruva_create_document",
      arguments: {
        productId: "p1",
        path: "prd.md",
        content: "# PRD",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("create_document", {
      productId: "p1",
      path: "prd.md",
      content: "# PRD",
    });
  });
});

describe("pruva_update_document", () => {
  it("sends productId, path, and content", async () => {
    mockCall.mockResolvedValue({ path: "prd.md", content: "Updated" });

    await client.callTool({
      name: "pruva_update_document",
      arguments: {
        productId: "p1",
        path: "prd.md",
        content: "Updated",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("update_document", {
      productId: "p1",
      path: "prd.md",
      content: "Updated",
    });
  });
});

describe("pruva_search_documents", () => {
  it("sends productId and query", async () => {
    mockCall.mockResolvedValue([
      { path: "overview.md", content_snippet: "...authentication..." },
    ]);

    await client.callTool({
      name: "pruva_search_documents",
      arguments: { productId: "p1", query: "authentication" },
    });

    expect(mockCall).toHaveBeenCalledWith("search_documents", {
      productId: "p1",
      query: "authentication",
    });
  });
});
