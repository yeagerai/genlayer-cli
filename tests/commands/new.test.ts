import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeScaffoldCommands } from "../../src/commands/scaffold";
import { NewAction } from "../../src/commands/scaffold/new";

vi.mock("../../src/commands/scaffold/new");

describe("new command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeScaffoldCommands(program);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("NewAction.createProject is called with default options", async () => {
    program.parse(["node", "test", "new", "myProject"]);
    expect(NewAction).toHaveBeenCalledTimes(1);
    expect(NewAction.prototype.createProject).toHaveBeenCalledWith("myProject", {
      path: ".",
      overwrite: false,
    });
  });

  test("NewAction.createProject is called with custom path", async () => {
    program.parse(["node", "test", "new", "myProject", "--path", "./customDir"]);
    expect(NewAction).toHaveBeenCalledTimes(1);
    expect(NewAction.prototype.createProject).toHaveBeenCalledWith("myProject", {
      path: "./customDir",
      overwrite: false,
    });
  });

  test("NewAction.createProject is called with overwrite flag", async () => {
    program.parse(["node", "test", "new", "myProject", "--overwrite"]);
    expect(NewAction).toHaveBeenCalledTimes(1);
    expect(NewAction.prototype.createProject).toHaveBeenCalledWith("myProject", {
      path: ".",
      overwrite: true,
    });
  });

  test("NewAction is instantiated when the new command is executed", async () => {
    program.parse(["node", "test", "new", "myProject"]);
    expect(NewAction).toHaveBeenCalledTimes(1);
  });

  test("throws error for unrecognized options", async () => {
    const newCommand = program.commands.find((cmd) => cmd.name() === "new");
    newCommand?.exitOverride();
    expect(() => program.parse(["node", "test", "new", "myProject", "--unknown"])).toThrowError(
      "error: unknown option '--unknown'"
    );
  });

  test("NewAction.createProject is called without throwing errors for valid options", async () => {
    program.parse(["node", "test", "new", "myProject"]);
    vi.mocked(NewAction.prototype.createProject).mockResolvedValueOnce(undefined);
    expect(() =>
      program.parse(["node", "test", "new", "myProject"])
    ).not.toThrow();
  });
});