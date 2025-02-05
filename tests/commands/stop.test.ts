import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeGeneralCommands } from "../../src/commands/general";
import { StopAction } from "../../src/commands/general/stop";

vi.mock("../../src/commands/general/stop");

describe("stop command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeGeneralCommands(program);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("doesn't require arguments or options", async () => {
    expect(() => program.parse(["node", "test", "stop"])).not.toThrow();
    expect(StopAction).toHaveBeenCalledTimes(1);
    expect(StopAction.prototype.stop).toHaveBeenCalledWith();
  });
});
