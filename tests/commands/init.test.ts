import {Command} from "commander";
import {jest} from "@jest/globals";
import {initializeGeneralCommands} from "../../src/commands/general";
import {getCommand, getCommandOption} from "../utils";

jest.mock("inquirer", () => ({
  prompt: jest.fn(() => {}),
}));
const action = jest.fn();

describe("init command", () => {
  let initCommand: Command;
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeGeneralCommands(program);

    initCommand = getCommand(program, "init");
    initCommand?.action(async args => {
      action(args);
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("doesn't have required arguments nor options", async () => {
    expect(() => program.parse(["node", "test", "init"])).not.toThrow();
  });

  test("option --numValidators is accepted", async () => {
    expect(() => program.parse(["node", "test", "init", "--numValidators", "10"])).not.toThrow();
  });

  test("option --numValidators default value is 5", async () => {
    // Given // When
    const numValidatorsOption = getCommandOption(initCommand, "--numValidators");
    expect(numValidatorsOption?.defaultValue).toBe("5");
  });

  test("option --branch is accepted", async () => {
    expect(() => program.parse(["node", "test", "init", "--branch", "example"])).not.toThrow();
  });

  test("option --branch default value is main", async () => {
    // Given // When
    const numValidatorsOption = getCommandOption(initCommand, "--branch");
    expect(numValidatorsOption?.defaultValue).toBe("main");
  });

  test("option --location is accepted", async () => {
    expect(() => program.parse(["node", "test", "init", "--location", "./current-dir"])).not.toThrow();
  });

  test("option --location default value is user's current directory", async () => {
    // Given // When
    const locationOption = getCommandOption(initCommand, "--location");
    expect(locationOption?.defaultValue).toBe(process.cwd());
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
    // Given When
    program.parse(["node", "test", "init"]);
    // Then
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({numValidators: "5", branch: "main", location: process.cwd()});
  });
});
