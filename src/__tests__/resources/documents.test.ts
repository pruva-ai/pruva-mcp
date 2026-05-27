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

describe("resource: product-documents (pruva://products/{productId}/documents)", () => {
  it("reads documents markdown", async () => {
    mockCall.mockResolvedValue(envelope([], "# Documents"));
    const res = await client.readResource({
      uri: "pruva://products/p1/documents",
    });
    expect(mockCall).toHaveBeenCalledWith("list_documents", {
      productId: "p1",
    });
    expect(res.contents[0]).toMatchObject({
      uri: "pruva://products/p1/documents",
      text: "# Documents",
    });
  });

  it("lists documents resources for each product", async () => {
    mockCall.mockResolvedValue(
      envelope([
        {
          id: "p1",
          name: "Product A",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
        },
      ]),
    );
    const res = await client.listResources();
    const uris = res.resources.filter((r) => r.uri.endsWith("/documents"));
    expect(uris).toEqual([
      {
        uri: "pruva://products/p1/documents",
        name: "Product A — Documents",
        mimeType: "text/markdown",
      },
    ]);
  });
});

describe("resource: document (pruva://products/{productId}/documents/{path})", () => {
  it("reads document content for simple path", async () => {
    mockCall.mockResolvedValue(envelope({ path: "spec.md", content: "hello" }));
    const res = await client.readResource({
      uri: "pruva://products/p1/documents/spec.md",
    });
    expect(mockCall).toHaveBeenCalledWith("get_document", {
      productId: "p1",
      path: "spec.md",
    });
    expect(res.contents[0]).toMatchObject({
      uri: "pruva://products/p1/documents/spec.md",
      mimeType: "text/markdown",
      text: "hello",
    });
  });

  it("URL-decodes nested path with encoded slashes", async () => {
    mockCall.mockResolvedValue(
      envelope({ path: "features/auth.md", content: "auth doc" }),
    );
    await client.readResource({
      uri: "pruva://products/p1/documents/features%2Fauth.md",
    });
    expect(mockCall).toHaveBeenCalledWith("get_document", {
      productId: "p1",
      path: "features/auth.md",
    });
  });

  it("falls back to empty string when content is missing", async () => {
    mockCall.mockResolvedValue(
      envelope({ path: "empty.md" } as { path: string; content?: string }),
    );
    const res = await client.readResource({
      uri: "pruva://products/p1/documents/empty.md",
    });
    expect(res.contents[0]).toMatchObject({ text: "" });
  });

  it("is not advertised in listResources (no list callback)", async () => {
    mockCall.mockResolvedValue(envelope([]));
    const res = await client.listResources();
    const docUris = res.resources.filter((r) =>
      /\/documents\/[^/]+/.test(r.uri),
    );
    expect(docUris).toEqual([]);
  });
});
