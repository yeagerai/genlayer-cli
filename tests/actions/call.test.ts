import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { createClient, createAccount } from "genlayer-js";
import { CallAction, CallOptions } from "../../src/commands/contracts/call";
import { getPrivateKey } from "../../src/lib/accounts/getPrivateKey";

vi.mock("genlayer-js");
vi.mock("../../src/lib/accounts/getPrivateKey");

describe("Call Action", () => {
  let caller: CallAction;
  const mockClient = {
    readContract: vi.fn(),
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    getContractSchema: vi.fn()
  };

  const mockPrivateKey = "mocked_private_key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockClient as any);
    vi.mocked(createAccount).mockReturnValue({ privateKey: mockPrivateKey } as any);
    vi.mocked(getPrivateKey).mockReturnValue(mockPrivateKey);
    caller = new CallAction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("calls readContract successfully", async () => {
    const options: CallOptions = {
      args: [1, 2, "Hello"]
    };
    const mockResult = "mocked_result";

    vi.mocked(mockClient.readContract).mockResolvedValue(mockResult);
    vi.mocked(mockClient.getContractSchema).mockResolvedValue({methods: {getData: {readonly: true}}});

    await caller.call({
      contractAddress: "0xMockedContract",
      method: "getData",
      ...options,
    });

    expect(mockClient.readContract).toHaveBeenCalledWith({
      address: "0xMockedContract",
      functionName: "getData",
      args: [1, 2, "Hello"],
    });
    expect(mockClient.readContract).toHaveResolvedWith(mockResult);
  });

  test("calls writeContract successfully", async () => {
    const options: CallOptions = {
      args: [42, "Update"]
    };
    const mockHash = "0xMockedTransactionHash";
    const mockReceipt = { status: "success" };

    vi.mocked(mockClient.writeContract).mockResolvedValue(mockHash);
    vi.mocked(mockClient.waitForTransactionReceipt).mockResolvedValue(mockReceipt);
    vi.mocked(mockClient.getContractSchema).mockResolvedValue({methods: {updateData: {readonly: false}}});

    await caller.call({
      contractAddress: "0xMockedContract",
      method: "updateData",
      ...options,
    });

    expect(mockClient.writeContract).toHaveBeenCalledWith({
      address: "0xMockedContract",
      functionName: "updateData",
      args: [42, "Update"],
      value: 0n,
    });
    expect(mockClient.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockHash,
      retries: 15,
      interval: 2000,
    });
    expect(mockClient.writeContract).toHaveResolvedWith(mockHash);
  });

  test("throws error when method is not found", async () => {
    const options: CallOptions = {
      args: []
    };

    vi.mocked(mockClient.getContractSchema).mockResolvedValue({methods: {updateData: {readonly: false}}});

    await expect(
      caller.call({
        contractAddress: "0xMockedContract",
        method: "getData",
        ...options,
      })
    ).rejects.toThrowError('process.exit unexpectedly called with "1"');

    expect(mockClient.readContract).not.toHaveBeenCalled();
    expect(mockClient.writeContract).not.toHaveBeenCalled();
  });

  test("handles errors during readContract", async () => {
    const options: CallOptions = {
      args: [1]
    };

    vi.mocked(mockClient.getContractSchema).mockResolvedValue({methods: {getData: {readonly: true}}});
    vi.mocked(mockClient.readContract).mockRejectedValue(
      new Error("Mocked read error")
    );

    await expect(
      caller.call({
        contractAddress: "0xMockedContract",
        method: "getData",
        ...options,
      })
    ).rejects.toThrowError("Mocked read error");

    expect(mockClient.readContract).toHaveBeenCalled();
  });

  test("handles errors during writeContract", async () => {
    const options: CallOptions = {
      args: [1]
    };

    vi.mocked(mockClient.getContractSchema).mockResolvedValue({methods: {updateData: {readonly: false}}});
    vi.mocked(mockClient.writeContract).mockRejectedValue(
      new Error("Mocked write error")
    );

    await expect(
      caller.call({
        contractAddress: "0xMockedContract",
        method: "updateData",
        ...options,
      })
    ).rejects.toThrowError("Mocked write error");

    expect(mockClient.writeContract).toHaveBeenCalled();
  });
});
