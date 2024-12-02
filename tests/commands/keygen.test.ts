import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeKeygenCommands } from "../../src/commands/keygen";
import { KeypairCreator } from "../../src/commands/keygen/create";

vi.mock("../../src/commands/keygen/create")

describe("keygen create command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeKeygenCommands(program);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("keypairCreator.createKeypairAction is called with default options", async () => {
    program.parse(["node", "test", "keygen", "create"]);
    expect(KeypairCreator).toHaveBeenCalledTimes(1);
    expect(KeypairCreator.prototype.createKeypairAction).toHaveBeenCalledWith({ output: "./keypair.json" });
  });

  test("keypairCreator.createKeypairAction is called with custom options", async () => {
    program.parse(["node", "test", "keygen", "create", "--output", "./custom.json"]);
    expect(KeypairCreator).toHaveBeenCalledTimes(1);
    expect(KeypairCreator.prototype.createKeypairAction).toHaveBeenCalledWith({ output: "./custom.json" });
  });

  test("KeypairCreator is instantiated when the command is executed", async () => {
    program.parse(["node", "test", "keygen", "create"]);
    expect(KeypairCreator).toHaveBeenCalledTimes(1);
  });

  test("throws error for unrecognized options", async () => {
    const keygenCommand = program.commands.find(cmd => cmd.name() === "keygen");
    const createCommand = keygenCommand?.commands.find(cmd => cmd.name() === "create");

    createCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "keygen", "create", "--unknown"])).toThrowError(
      "error: unknown option '--unknown'"
    );
  });

  test("keypairCreator.createKeypairAction is called with default options", async () => {
    program.parse(["node", "test", "keygen", "create"]);
    vi.mocked(KeypairCreator.prototype.createKeypairAction).mockReturnValue()
    expect(() => program.parse(["node", "test", "keygen", "create"])).not.toThrow();
  });
});

