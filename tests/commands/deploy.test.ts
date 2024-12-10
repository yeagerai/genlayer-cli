import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeGeneralCommands } from "../../src/commands/general";
import { DeployAction } from "../../src/commands/general/deploy";

vi.mock("../../src/commands/general/deploy");

describe("deploy command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeGeneralCommands(program);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("DeployAction.deploy is called with default options", async () => {
    program.parse(["node", "test", "deploy", "--contract", "./path/to/contract"]);
    expect(DeployAction).toHaveBeenCalledTimes(1);
    expect(DeployAction.prototype.deploy).toHaveBeenCalledWith({
      contract: "./path/to/contract",
      args: [],
      kwargs: "",
    });
  });

  test("DeployAction.deploy is called with positional arguments", async () => {
    program.parse([
      "node",
      "test",
      "deploy",
      "--contract",
      "./path/to/contract",
      "--args",
      "1",
      "2",
      "3",
    ]);
    expect(DeployAction).toHaveBeenCalledTimes(1);
    expect(DeployAction.prototype.deploy).toHaveBeenCalledWith({
      contract: "./path/to/contract",
      args: ["1", "2", "3"],
      kwargs: "",
    });
  });

  test("DeployAction.deploy is called with key-value arguments (kwargs)", async () => {
    program.parse([
      "node",
      "test",
      "deploy",
      "--contract",
      "./path/to/contract",
      "--kwargs",
      "key1=value1,key2=42",
    ]);
    expect(DeployAction).toHaveBeenCalledTimes(1);
    expect(DeployAction.prototype.deploy).toHaveBeenCalledWith({
      contract: "./path/to/contract",
      args: [],
      kwargs: "key1=value1,key2=42",
    });
  });

  test("DeployAction.deploy is called with both args and kwargs", async () => {
    program.parse([
      "node",
      "test",
      "deploy",
      "--contract",
      "./path/to/contract",
      "--args",
      "1",
      "2",
      "3",
      "--kwargs",
      "key1=value1,key2=42",
    ]);
    expect(DeployAction).toHaveBeenCalledTimes(1);
    expect(DeployAction.prototype.deploy).toHaveBeenCalledWith({
      contract: "./path/to/contract",
      args: ["1", "2", "3"],
      kwargs: "key1=value1,key2=42",
    });
  });

  test("DeployAction is instantiated when the deploy command is executed", async () => {
    program.parse(["node", "test", "deploy", "--contract", "./path/to/contract"]);
    expect(DeployAction).toHaveBeenCalledTimes(1);
  });

  test("throws error for unrecognized options", async () => {
    const deployCommand = program.commands.find((cmd) => cmd.name() === "deploy");
    deployCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "deploy", "--unknown"])).toThrowError(
      "error: unknown option '--unknown'"
    );
  });

  test("DeployAction.deploy is called without throwing errors for valid options", async () => {
    program.parse(["node", "test", "deploy", "--contract", "./path/to/contract"]);
    vi.mocked(DeployAction.prototype.deploy).mockResolvedValueOnce(undefined);
    expect(() =>
      program.parse(["node", "test", "deploy", "--contract", "./path/to/contract"])
    ).not.toThrow();
  });
});
