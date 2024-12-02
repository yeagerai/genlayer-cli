import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { KeypairCreator } from "../../src/commands/keygen/create";
import { writeFileSync } from "fs";
import { ethers } from "ethers";

vi.mock("fs");

vi.mock("ethers", () => ({
  ethers: {
    Wallet: {
      createRandom: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/config/ConfigFileManager", () => ({
  ConfigFileManager: vi.fn().mockImplementation(() => ({
    getFilePath: vi.fn((fileName) => `/mocked/path/${fileName}`),
    writeConfig: vi.fn(),
  })),
}));

describe("KeypairCreator", () => {
  let keypairCreator: KeypairCreator;

  const mockWallet: any = {
    address: "0xMockedAddress",
    privateKey: "0xMockedPrivateKey",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    keypairCreator = new KeypairCreator();
    vi.mocked(ethers.Wallet.createRandom).mockReturnValue(mockWallet);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("successfully creates and saves a keypair", () => {
    const consoleLogSpy = vi.spyOn(console, "log");
    const options = { output: "keypair.json" };

    keypairCreator.createKeypairAction(options);

    expect(ethers.Wallet.createRandom).toHaveBeenCalledTimes(1);

    expect(keypairCreator["filePathManager"].getFilePath).toHaveBeenCalledWith("keypair.json");

    expect(writeFileSync).toHaveBeenCalledWith(
      "/mocked/path/keypair.json",
      JSON.stringify(
        {
          address: mockWallet.address,
          privateKey: mockWallet.privateKey,
        },
        null,
        2
      )
    );

    expect(keypairCreator["filePathManager"].writeConfig).toHaveBeenCalledWith(
      "keyPairPath",
      "/mocked/path/keypair.json"
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Keypair successfully created and saved to: /mocked/path/keypair.json"
    );
  });


  test("handles errors during keypair creation", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("Mocked write error");
    });

    expect(() => {
      keypairCreator.createKeypairAction({ output: "keypair.json" });
    }).toThrowError("process.exit");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to generate keypair:", expect.any(Error));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
