import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { PruvaClient } from "../../client.js";
import { createPruvaServer } from "../../server.js";

let mockChat: ReturnType<typeof vi.fn>;
let mockCall: ReturnType<typeof vi.fn>;
let client: Client;

const VALID_PRODUCT_ID = "11111111-1111-1111-1111-111111111111";

beforeAll(async () => {
  mockCall = vi.fn();
  mockChat = vi.fn();
  const mockPruvaClient = {
    call: mockCall,
    chat: mockChat,
  } as unknown as PruvaClient;
  const server = createPruvaServer(mockPruvaClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
});

beforeEach(() => {
  mockChat.mockReset();
  mockCall.mockReset();
});

describe("pruva_ask", () => {
  const successResponse = {
    reply: "Here is what I found.",
    usage: { input_tokens: 42, output_tokens: 17 },
  };

  it("calls client.chat with params", async () => {
    mockChat.mockResolvedValue(successResponse);

    await client.callTool({
      name: "pruva_ask",
      arguments: {
        productId: VALID_PRODUCT_ID,
        message: "What features are there?",
      },
    });

    expect(mockChat).toHaveBeenCalledWith({
      productId: VALID_PRODUCT_ID,
      message: "What features are there?",
      history: undefined,
      featureSlug: undefined,
    });
  });

  it("passes optional history and featureSlug through", async () => {
    mockChat.mockResolvedValue(successResponse);

    const history = [
      { role: "user" as const, content: "hi" },
      { role: "assistant" as const, content: "hello" },
    ];

    await client.callTool({
      name: "pruva_ask",
      arguments: {
        productId: VALID_PRODUCT_ID,
        message: "follow-up",
        history,
        featureSlug: "auth-login",
      },
    });

    expect(mockChat).toHaveBeenCalledWith({
      productId: VALID_PRODUCT_ID,
      message: "follow-up",
      history,
      featureSlug: "auth-login",
    });
  });

  it("returns chat response as formatted JSON", async () => {
    mockChat.mockResolvedValue(successResponse);

    const result = await client.callTool({
      name: "pruva_ask",
      arguments: {
        productId: VALID_PRODUCT_ID,
        message: "hello",
      },
    });

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(successResponse, null, 2) },
    ]);
  });

  it("propagates errors as isError results", async () => {
    mockChat.mockRejectedValue(new Error("Invalid API key"));

    const result = await client.callTool({
      name: "pruva_ask",
      arguments: {
        productId: VALID_PRODUCT_ID,
        message: "hello",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Invalid API key" },
    ]);
  });
});
