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
  it("sends productId with no optional filters", async () => {
    mockCall.mockResolvedValue([]);

    await client.callTool({
      name: "pruva_list_documents",
      arguments: { productId: "p1" },
    });

    expect(mockCall).toHaveBeenCalledWith("list_documents", {
      productId: "p1",
      docType: undefined,
      featureId: undefined,
    });
  });

  it("sends optional docType and featureId", async () => {
    mockCall.mockResolvedValue([]);

    await client.callTool({
      name: "pruva_list_documents",
      arguments: { productId: "p1", docType: "prd", featureId: "f1" },
    });

    expect(mockCall).toHaveBeenCalledWith("list_documents", {
      productId: "p1",
      docType: "prd",
      featureId: "f1",
    });
  });
});

describe("pruva_get_document", () => {
  it("sends documentId", async () => {
    mockCall.mockResolvedValue({ id: "d1", content: "# Hello" });

    await client.callTool({
      name: "pruva_get_document",
      arguments: { documentId: "d1" },
    });

    expect(mockCall).toHaveBeenCalledWith("get_document", {
      documentId: "d1",
    });
  });
});

describe("pruva_create_document", () => {
  it("sends all required and optional fields", async () => {
    mockCall.mockResolvedValue({ id: "d-new" });

    await client.callTool({
      name: "pruva_create_document",
      arguments: {
        productId: "p1",
        path: "features/auth/spec.md",
        content: "# Auth Spec",
        docType: "feature-content",
        featureId: "f1",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("create_document", {
      productId: "p1",
      path: "features/auth/spec.md",
      content: "# Auth Spec",
      docType: "feature-content",
      featureId: "f1",
    });
  });

  it("sends undefined featureId when not provided", async () => {
    mockCall.mockResolvedValue({ id: "d-new" });

    await client.callTool({
      name: "pruva_create_document",
      arguments: {
        productId: "p1",
        path: "docs/prd.md",
        content: "# PRD",
        docType: "prd",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("create_document", {
      productId: "p1",
      path: "docs/prd.md",
      content: "# PRD",
      docType: "prd",
      featureId: undefined,
    });
  });
});

describe("pruva_update_document", () => {
  it("sends documentId with optional content and path", async () => {
    mockCall.mockResolvedValue({ id: "d1" });

    await client.callTool({
      name: "pruva_update_document",
      arguments: {
        documentId: "d1",
        content: "Updated content",
        path: "new/path.md",
      },
    });

    expect(mockCall).toHaveBeenCalledWith("update_document", {
      documentId: "d1",
      content: "Updated content",
      path: "new/path.md",
    });
  });
});

describe("pruva_search_documents", () => {
  it("sends productId and query", async () => {
    mockCall.mockResolvedValue([]);

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
