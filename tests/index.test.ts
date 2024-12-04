import { describe, it, vi, expect } from "vitest";
import { initializeCLI } from "../src/index";

vi.mock("commander", () => ({
  program: {
    version: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    parse: vi.fn(),
  },
}));

vi.mock("../src/commands/general", () => ({
  initializeGeneralCommands: vi.fn(),
}));

vi.mock("../src/commands/keygen", () => ({
  initializeKeygenCommands: vi.fn(),
}));


describe("CLI", () => {
  it("should initialize CLI", () => {
    expect(initializeCLI).not.toThrow();
  });
});
