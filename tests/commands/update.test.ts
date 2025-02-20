import { Command } from "commander";
import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { initializeUpdateCommands } from "../../src/commands/update";
import { OllamaAction } from "../../src/commands/update/ollama";

vi.mock("../../src/commands/update/ollama");

describe("ollama command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    initializeUpdateCommands(program);

    const mockConfig = { defaultOllamaModel: "default-model" };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("OllamaAction.updateModel is called with model option", async () => {
    program.parse(["node", "test", "update", "ollama", "--model", "mocked_model"]);
    expect(OllamaAction).toHaveBeenCalledTimes(1);
    expect(OllamaAction.prototype.updateModel).toHaveBeenCalledWith("mocked_model");
  });

  test("OllamaAction.updateModel is called with default model", async () => {
    program.parse(["node", "test", "update", "ollama"]);
    expect(OllamaAction).toHaveBeenCalledTimes(1);
    expect(OllamaAction.prototype.updateModel).toHaveBeenCalledWith("");
  });

  test("OllamaAction.removeModel is called with model option", async () => {
    program.parse(["node", "test", "update", "ollama", "--model", "mocked_model", "--remove"]);
    expect(OllamaAction).toHaveBeenCalledTimes(1);
    expect(OllamaAction.prototype.removeModel).toHaveBeenCalledWith("mocked_model");
  });

  test("OllamaAction.removeModel is called with default model", async () => {
    program.parse(["node", "test", "update", "ollama", "--remove"]);
    expect(OllamaAction).toHaveBeenCalledTimes(1);
    expect(OllamaAction.prototype.removeModel).toHaveBeenCalledWith("");
  });
});
