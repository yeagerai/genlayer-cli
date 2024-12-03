import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { ConfigActions } from "../../src/commands/config/getSetReset";
import { ConfigFileManager } from "../../src/lib/config/ConfigFileManager";

vi.mock("../../src/lib/config/ConfigFileManager");

describe("ConfigActions", () => {
  let configActions: ConfigActions;

  beforeEach(() => {
    configActions = new ConfigActions();
    vi.clearAllMocks();
  });

  new ConfigFileManager();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("set method writes key-value pair to the configuration", () => {
    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.set("defaultNetwork=testnet");

    expect(configActions["configManager"].writeConfig).toHaveBeenCalledWith("defaultNetwork", "testnet");
    expect(consoleLogSpy).toHaveBeenCalledWith("Configuration updated: defaultNetwork=testnet");
  });

  test("set method throws error for invalid format", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    expect(() => configActions.set("invalidFormat")).toThrowError("process.exit");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid format. Use key=value.");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("get method retrieves value for a specific key", () => {
    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue("testnet");

    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.get("defaultNetwork");

    expect(configActions["configManager"].getConfigByKey).toHaveBeenCalledWith("defaultNetwork");
    expect(consoleLogSpy).toHaveBeenCalledWith("defaultNetwork=testnet");
  });

  test("get method prints message when key has no value", () => {
    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue(null);

    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.get("nonexistentKey");

    expect(configActions["configManager"].getConfigByKey).toHaveBeenCalledWith("nonexistentKey");
    expect(consoleLogSpy).toHaveBeenCalledWith("No value set for key: nonexistentKey");
  });

  test("get method retrieves the entire configuration when no key is provided", () => {
    const mockConfig = { defaultNetwork: "testnet" };
    vi.mocked(ConfigFileManager.prototype.getConfig).mockReturnValue(mockConfig);

    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.get();

    expect(configActions["configManager"].getConfig).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith("Current configuration:", JSON.stringify(mockConfig, null, 2));
  });

  test("reset method removes key from configuration", () => {
    const mockConfig = { defaultNetwork: "testnet" };
    vi.mocked(ConfigFileManager.prototype.getConfig).mockReturnValue(mockConfig);

    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.reset("defaultNetwork");

    expect(configActions["configManager"].getConfig).toHaveBeenCalledTimes(1);
    expect(configActions["configManager"].writeConfig).toHaveBeenCalledWith("defaultNetwork", undefined);
    expect(consoleLogSpy).toHaveBeenCalledWith("Configuration key reset: defaultNetwork");
  });

  test("reset method prints message when key does not exist", () => {
    const mockConfig = {};
    vi.mocked(ConfigFileManager.prototype.getConfig).mockReturnValue(mockConfig);

    const consoleLogSpy = vi.spyOn(console, "log");

    configActions.reset("nonexistentKey");

    expect(configActions["configManager"].getConfig).toHaveBeenCalledTimes(1);
    expect(configActions["configManager"].writeConfig).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("Key does not exist in the configuration: nonexistentKey");
  });
});
