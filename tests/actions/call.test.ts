import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { createClient, createAccount } from "genlayer-js";
import { CallAction } from "../../src/commands/contracts/call";

vi.mock("genlayer-js");

describe("CallAction", () => {
  let callActions: CallAction;
  const mockClient = {
    readContract: vi.fn(),
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    getContractSchema: vi.fn(),
  };

  const mockPrivateKey = "mocked_private_key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockClient as any);
    vi.mocked(createAccount).mockReturnValue({ privateKey: mockPrivateKey } as any);
    callActions = new CallAction();
    vi.spyOn(callActions as any, "getPrivateKey").mockResolvedValue(mockPrivateKey);

    vi.spyOn(callActions as any, "startSpinner").mockImplementation(() => {});
    vi.spyOn(callActions as any, "succeedSpinner").mockImplementation(() => {});
    vi.spyOn(callActions as any, "failSpinner").mockImplementation(() => {});
    vi.spyOn(callActions as any, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("calls readContract successfully", async () => {
    const options = { args: [1, 2, "Hello"] };
    const mockResult = "mocked_result";

    vi.mocked(mockClient.getContractSchema).mockResolvedValue({ methods: { getData: { readonly: true } } });
    vi.mocked(mockClient.readContract).mockResolvedValue(mockResult);

    await callActions.call({
      contractAddress: "0xMockedContract",
      method: "getData",
      ...options,
    });

    expect(mockClient.readContract).toHaveBeenCalledWith({
      address: "0xMockedContract",
      functionName: "getData",
      args: [1, 2, "Hello"],
    });
    expect(callActions["succeedSpinner"]).toHaveBeenCalledWith("Read operation successfully executed", "mocked_result");
  });

  test("calls writeContract successfully", async () => {
    const options = { args: [42, "Update"] };
    const mockHash = "0xMockedTransactionHash";
    const mockReceipt = { status: "success" };

    vi.mocked(mockClient.getContractSchema).mockResolvedValue({ methods: { updateData: { readonly: false } } });
    vi.mocked(mockClient.writeContract).mockResolvedValue(mockHash);
    vi.mocked(mockClient.waitForTransactionReceipt).mockResolvedValue(mockReceipt);

    await callActions.call({
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
    expect(callActions["log"]).toHaveBeenCalledWith("Write transaction hash:", mockHash);
    expect(callActions["succeedSpinner"]).toHaveBeenCalledWith("Write operation successfully executed", mockReceipt);
  });

  test("fails when method is not found", async () => {
    vi.mocked(mockClient.getContractSchema).mockResolvedValue({ methods: { updateData: { readonly: false } } });

    await callActions.call({ contractAddress: "0xMockedContract", method: "getData", args: [] });

    expect(callActions["failSpinner"]).toHaveBeenCalledWith("method getData not found.");
  });

  test("handles readContract errors", async () => {
    vi.mocked(mockClient.getContractSchema).mockResolvedValue({ methods: { getData: { readonly: true } } });
    vi.mocked(mockClient.readContract).mockRejectedValue(new Error("Mocked read error"));

    await callActions.call({ contractAddress: "0xMockedContract", method: "getData", args: [1] });

    expect(callActions["failSpinner"]).toHaveBeenCalledWith("Error during read operation", expect.any(Error));
  });

  test("handles writeContract errors", async () => {
    vi.mocked(mockClient.getContractSchema).mockResolvedValue({ methods: { updateData: { readonly: false } } });
    vi.mocked(mockClient.writeContract).mockRejectedValue(new Error("Mocked write error"));

    await callActions.call({ contractAddress: "0xMockedContract", method: "updateData", args: [1] });

    expect(callActions["failSpinner"]).toHaveBeenCalledWith("Error during write operation", expect.any(Error));
  });
});