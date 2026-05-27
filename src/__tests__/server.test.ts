import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { PruvaClient } from "../client.js";
import { createPruvaServer } from "../server.js";

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8"),
) as { version: string };

const EXPECTED_TOOLS = [
  "pruva_list_products",
  "pruva_get_product",
  "pruva_list_features",
  "pruva_get_feature",
  "pruva_create_feature",
  "pruva_update_feature",
  "pruva_list_documents",
  "pruva_get_document",
  "pruva_create_document",
  "pruva_update_document",
  "pruva_search_documents",
  "pruva_list_feature_relations",
  "pruva_ask",
];

const EXPECTED_RESOURCE_TEMPLATES = [
  "pruva://products/{productId}",
  "pruva://products/{productId}/features",
  "pruva://products/{productId}/relations",
  "pruva://products/{productId}/documents",
  "pruva://products/{productId}/documents/{path}",
];

let client: Client;

beforeAll(async () => {
  const mockPruvaClient = { call: vi.fn() } as unknown as PruvaClient;
  const server = createPruvaServer(() => mockPruvaClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
});

describe("createPruvaServer", () => {
  it("advertises server info name=pruva with package version", () => {
    const info = client.getServerVersion();
    expect(info).toEqual({ name: "pruva", version: pkg.version });
  });

  it("registers exactly 13 tools with expected names", async () => {
    const res = await client.listTools();
    const names = res.tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("registers exactly 5 resource templates with expected URIs", async () => {
    const res = await client.listResourceTemplates();
    const uris = res.resourceTemplates.map((t) => t.uriTemplate).sort();
    expect(uris).toEqual([...EXPECTED_RESOURCE_TEMPLATES].sort());
  });

  it("calls the provider with extra so per-request auth flows through", async () => {
    const provider = vi.fn(
      () => ({ call: vi.fn().mockResolvedValue({ data: [], markdown: "" }) }) as unknown as PruvaClient,
    );
    const server = createPruvaServer(provider);
    const [ct, st] = InMemoryTransport.createLinkedPair();
    await server.connect(st);
    const c = new Client({ name: "test", version: "1.0.0" });
    await c.connect(ct);

    await c.callTool({ name: "pruva_list_products", arguments: {} });
    expect(provider).toHaveBeenCalled();
  });
});
