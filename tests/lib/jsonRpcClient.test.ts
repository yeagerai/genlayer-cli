import { describe, beforeEach, test, expect, vi, Mock } from "vitest";
import fetch from "node-fetch";
import { JsonRpcClient, JsonRPCParams } from "../../src/lib/clients/jsonRpcClient";
import { v4 as uuidv4 } from "uuid";

vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: vi.fn(),
}));

describe("JsonRpcClient - Successful Request", () => {
  let rpcClient: JsonRpcClient;
  const mockServerUrl = "http://mock-server-url.com";

  beforeEach(() => {
    rpcClient = new JsonRpcClient(mockServerUrl);
  });

  test("should make a successful JSON-RPC request and return the JSON response", async () => {
    const mockResponse = { result: "success" };
    const mockId = "test-uuid";
    (uuidv4 as Mock).mockReturnValueOnce(mockId);

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const params: JsonRPCParams = {
      method: "testMethod",
      params: ["param1", "param2"],
    };

    const response = await rpcClient.request(params);

    expect(fetch).toHaveBeenCalledWith(mockServerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: mockId,
        method: "testMethod",
        params: ["param1", "param2"],
      }),
    });
    expect(response).toEqual(mockResponse);
  });
});
