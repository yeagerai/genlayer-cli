import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { ethers } from "ethers";
import { KeypairManager } from "../../../src/lib/accounts/KeypairManager";

vi.mock("fs");
vi.mock("ethers");

describe("KeypairManager", () => {
  let keypairManager: KeypairManager;
  const mockPrivateKey = "0xMockedPrivateKey";
  const mockAddress = "0xMockedAddress";
  const mockKeypairPath = "/mocked/path/keypair.json";
  const mockKeypairData = {
    address: mockAddress,
    privateKey: mockPrivateKey,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    keypairManager = new KeypairManager();
    vi.spyOn(keypairManager as any, "getConfigByKey").mockReturnValue(mockKeypairPath);
    vi.spyOn(keypairManager as any, "writeConfig").mockImplementation(() => {});
    vi.spyOn(keypairManager as any, "getFilePath").mockReturnValue(mockKeypairPath);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPrivateKey", () => {
    test("should return private key when keypair file exists and contains private key", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockKeypairData));

      const result = keypairManager.getPrivateKey();

      expect(result).toBe(mockPrivateKey);
      expect(existsSync).toHaveBeenCalledWith(mockKeypairPath);
      expect(readFileSync).toHaveBeenCalledWith(mockKeypairPath, "utf-8");
    });

    test("should return empty string when keypair file does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = keypairManager.getPrivateKey();

      expect(result).toBe("");
      expect(existsSync).toHaveBeenCalledWith(mockKeypairPath);
      expect(readFileSync).not.toHaveBeenCalled();
    });

    test("should return empty string when keypair file exists but has no private key", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ address: mockAddress }));

      const result = keypairManager.getPrivateKey();

      expect(result).toBe("");
      expect(existsSync).toHaveBeenCalledWith(mockKeypairPath);
      expect(readFileSync).toHaveBeenCalledWith(mockKeypairPath, "utf-8");
    });
  });

  describe("createKeypair", () => {
    test("should create new keypair and save it to file", () => {
      const mockWallet = {
        address: mockAddress,
        privateKey: mockPrivateKey,
      };
      vi.mocked(ethers.Wallet.createRandom).mockReturnValue(mockWallet as any);
      vi.mocked(existsSync).mockReturnValue(false);

      keypairManager.createKeypair();

      expect(ethers.Wallet.createRandom).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith(
        mockKeypairPath,
        JSON.stringify(mockKeypairData, null, 2)
      );
      expect(keypairManager["writeConfig"]).toHaveBeenCalledWith("keyPairPath", mockKeypairPath);
    });

    test("should throw error when file exists and overwrite is false", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(() => keypairManager.createKeypair()).toThrow(
        `The file at ${mockKeypairPath} already exists. Use the '--overwrite' option to replace it.`
      );
    });

    test("should overwrite existing file when overwrite is true", () => {
      const mockWallet = {
        address: mockAddress,
        privateKey: mockPrivateKey,
      };
      vi.mocked(ethers.Wallet.createRandom).mockReturnValue(mockWallet as any);
      vi.mocked(existsSync).mockReturnValue(true);

      keypairManager.createKeypair("./keypair.json", true);

      expect(ethers.Wallet.createRandom).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith(
        mockKeypairPath,
        JSON.stringify(mockKeypairData, null, 2)
      );
      expect(keypairManager["writeConfig"]).toHaveBeenCalledWith("keyPairPath", mockKeypairPath);
    });
  });
}); 