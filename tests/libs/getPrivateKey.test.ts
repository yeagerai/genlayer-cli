import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import fs from "fs";
import { getPrivateKey } from "../../src/lib/accounts/getPrivateKey";
import { ConfigFileManager } from "../../src/lib/config/ConfigFileManager";

vi.mock("fs");
vi.mock("../../src/lib/config/ConfigFileManager");

describe("getPrivateKey", () => {
  new ConfigFileManager();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns the private key if the file exists and is valid", () => {
    const mockPath = "/mocked/path/keypair.json";
    const mockPrivateKey = "0xMockedPrivateKey";
    const mockKeypairData = { privateKey: mockPrivateKey };

    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue(mockPath);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockKeypairData));

    const privateKey = getPrivateKey();

    expect(ConfigFileManager.prototype.getConfigByKey).toHaveBeenCalledWith("keyPairPath");
    expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, "utf-8");
    expect(privateKey).toBe(mockPrivateKey);
  });

  test("exits if the keypair path is missing in the config", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue(null);

    expect(() => getPrivateKey()).toThrowError("process.exit");

    expect(ConfigFileManager.prototype.getConfigByKey).toHaveBeenCalledWith("keyPairPath");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Keypair file not found. Please generate or specify a valid keypair path."
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits if the keypair file does not exist", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    const mockPath = "/mocked/path/keypair.json";

    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue(mockPath);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => getPrivateKey()).toThrowError("process.exit");

    expect(ConfigFileManager.prototype.getConfigByKey).toHaveBeenCalledWith("keyPairPath");
    expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Keypair file not found. Please generate or specify a valid keypair path."
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits if the private key is missing in the keypair file", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    const mockPath = "/mocked/path/keypair.json";
    const mockKeypairData = { notPrivateKey: "SomeOtherData" }; // Invalid keypair data

    vi.mocked(ConfigFileManager.prototype.getConfigByKey).mockReturnValue(mockPath);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockKeypairData));

    expect(() => getPrivateKey()).toThrowError("process.exit");

    expect(ConfigFileManager.prototype.getConfigByKey).toHaveBeenCalledWith("keyPairPath");
    expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, "utf-8");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid keypair file. Private key is missing.");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
