import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeConfigCommands } from "../../src/commands/config";
import { ConfigActions } from "../../src/commands/config/getSetReset";

vi.mock("../../src/commands/config/getSetReset");

describe("config commands", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeConfigCommands(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("ConfigActions.set is called with the correct key-value pair", async () => {
    program.parse(["node", "test", "config", "set", "defaultNetwork=testnet"]);
    expect(ConfigActions).toHaveBeenCalledTimes(1);
    expect(ConfigActions.prototype.set).toHaveBeenCalledWith("defaultNetwork=testnet");
  });

  test("ConfigActions.get is called with a specific key", async () => {
    program.parse(["node", "test", "config", "get", "defaultNetwork"]);
    expect(ConfigActions).toHaveBeenCalledTimes(1);
    expect(ConfigActions.prototype.get).toHaveBeenCalledWith("defaultNetwork");
  });

  test("ConfigActions.get is called without a key", async () => {
    program.parse(["node", "test", "config", "get"]);
    expect(ConfigActions).toHaveBeenCalledTimes(1);
    expect(ConfigActions.prototype.get).toHaveBeenCalledWith(undefined);
  });

  test("ConfigActions.reset is called with the correct key", async () => {
    program.parse(["node", "test", "config", "reset", "defaultNetwork"]);
    expect(ConfigActions).toHaveBeenCalledTimes(1);
    expect(ConfigActions.prototype.reset).toHaveBeenCalledWith("defaultNetwork");
  });

  test("ConfigActions is instantiated when the command is executed", async () => {
    program.parse(["node", "test", "config", "set", "defaultNetwork=testnet"]);
    expect(ConfigActions).toHaveBeenCalledTimes(1);
  });

  test("ConfigActions.set is called without throwing errors for valid input", async () => {
    program.parse(["node", "test", "config", "set", "defaultNetwork=testnet"]);
    vi.mocked(ConfigActions.prototype.set).mockReturnValue();
    expect(() => program.parse(["node", "test", "config", "set", "defaultNetwork=testnet"])).not.toThrow();
  });
});
