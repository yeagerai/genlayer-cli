import { Command } from "commander";
import { CallAction } from "../../src/commands/contracts/call";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeContractsCommands } from "../../src/commands/contracts";

vi.mock("../../src/commands/contracts/call");
vi.mock("esbuild", () => ({
  buildSync: vi.fn(),
}));

describe("call command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeContractsCommands(program);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("CallAction.call is called with default options", async () => {
    program.parse(["node", "test", "call", "0xMockedContract", "getData"]);
    expect(CallAction).toHaveBeenCalledTimes(1);
    expect(CallAction.prototype.call).toHaveBeenCalledWith({
      contractAddress: "0xMockedContract",
      method: "getData",
      args: []
    });
  });

  test("CallAction.call is called with positional arguments", async () => {
    program.parse([
      "node",
      "test",
      "call",
      "0xMockedContract",
      "updateData",
      "--args",
      "1",
      "2",
      "Hello",
    ]);
    expect(CallAction).toHaveBeenCalledTimes(1);
    expect(CallAction.prototype.call).toHaveBeenCalledWith({
      contractAddress: "0xMockedContract",
      method: "updateData",
      args: ["1", "2", "Hello"]
    });
  });

  test("CallAction is instantiated when the call command is executed", async () => {
    program.parse(["node", "test", "call", "0xMockedContract", "getData"]);
    expect(CallAction).toHaveBeenCalledTimes(1);
  });

  test("throws error for unrecognized options", async () => {
    const callCommand = program.commands.find((cmd) => cmd.name() === "call");
    callCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "call", "0xMockedContract", "getData", "--unknown"]))
      .toThrowError("error: unknown option '--unknown'");
  });

  test("CallAction.call is called without throwing errors for valid options", async () => {
    program.parse(["node", "test", "call", "0xMockedContract", "getData"]);
    vi.mocked(CallAction.prototype.call).mockResolvedValueOnce(undefined);
    expect(() =>
      program.parse(["node", "test", "call", "0xMockedContract", "getData"])
    ).not.toThrow();
  });
});
