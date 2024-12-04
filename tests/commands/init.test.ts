import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeGeneralCommands } from "../../src/commands/general";
import { getCommand, getCommandOption } from "../utils";
import simulatorService from  '../../src/lib/services/simulator'

const openFrontendSpy = vi.spyOn(simulatorService, "openFrontend");
const defaultOptions = {
  numValidators: "5",
  headless: false,
  resetDb: false
}

vi.mock("inquirer", () => ({
  prompt: vi.fn(() => {}),
}));

const action = vi.fn();

describe("init command", () => {
  let initCommand: Command;
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeGeneralCommands(program);

    initCommand = getCommand(program, "init");
    initCommand?.action(async (args) => {
      action(args);
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("doesn't have required arguments nor options", async () => {
    expect(() => program.parse(["node", "test", "init"])).not.toThrow();
  });

  test("option --numValidators is accepted", async () => {
    expect(() => program.parse(["node", "test", "init", "--numValidators", "10"])).not.toThrow();
  });

  test("option --numValidators default value is 5", async () => {
    const numValidatorsOption = getCommandOption(initCommand, "--numValidators");
    expect(numValidatorsOption?.defaultValue).toBe("5");
  });


  test("random option is not accepted", async () => {
    initCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "init", "-random"])).toThrowError(
      "error: unknown option '-random'"
    );
    expect(() => program.parse(["node", "test", "init", "--randomOption"])).toThrowError(
      "error: unknown option '--randomOption'"
    );
  });

  test("action is called", async () => {
    program.parse(["node", "test", "init"]);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(defaultOptions);
  });

  test("option --headless is accepted", async () => {
    program.parse(["node", "test", "init", "--headless"]);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({...defaultOptions, headless: true});
    expect(openFrontendSpy).not.toHaveBeenCalled();
  });
});
