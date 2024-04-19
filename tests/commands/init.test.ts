import {program} from "commander";

import {initializeGeneralCommands} from "../../src/commands/general";
import {getCommand, getCommandOption} from "../utils";

jest.mock("inquirer", () => ({
  prompt: jest.fn().mockResolvedValue({}),
}));
const action = jest.fn();

describe("init command", () => {
  initializeGeneralCommands(program);
  const initCommand = getCommand("init");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("doesn't have required arguments nor options", async () => {
    expect(() => program.parse(["node", "test", "init"])).not.toThrow();
  });

  test("option -n, --numValidators is accepted", async () => {
    expect(() => program.parse(["node", "test", "init", "-n", "10"])).not.toThrow();
    expect(() => program.parse(["node", "test", "init", "--numValidators", "10"])).not.toThrow();
  });

  test("option -n, --numValidators default value is 5", async () => {
    // Given // When
    const numValidatorsOption = getCommandOption(initCommand, "--numValidators");
    expect(numValidatorsOption?.defaultValue).toBe("5");
  });

  test("random option is not accepted", async () => {
    initCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "init", "-random"])).toThrow(
      "error: unknown option '-random'",
    );
    expect(() => program.parse(["node", "test", "init", "--randomOption"])).toThrow(
      "error: unknown option '--randomOption'",
    );
  });

  test("action is called", async () => {
    // Given
    initCommand?.action(action);
    // When
    program.parse(["node", "test", "init"]);
    // Then
    expect(action).toHaveBeenCalledTimes(1);
  });
});
