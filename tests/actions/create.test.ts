import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { KeypairCreator } from "../../src/commands/keygen/create";
import { writeFileSync, existsSync } from "fs";
import { ethers } from "ethers";

vi.mock("fs");

vi.mock("ethers", () => ({
  ethers: {
    Wallet: {
      createRandom: vi.fn(),
    },
  },
}));

describe("KeypairCreator", () => {
  let keypairCreator: KeypairCreator;

  const mockWallet: any = {
    address: "0xMockedAddress",
    privateKey: "0xMockedPrivateKey",
  };
  keypairCreator = new KeypairCreator();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(keypairCreator as any, "startSpinner").mockImplementation(() => {});
    vi.spyOn(keypairCreator as any, "succeedSpinner").mockImplementation(() => {});
    vi.spyOn(keypairCreator as any, "failSpinner").mockImplementation(() => {});
    vi.spyOn(keypairCreator as any, "writeConfig").mockImplementation(() => {});
    vi.spyOn(keypairCreator as any, "getFilePath").mockImplementation((fileName) => `/mocked/path/${fileName}`);
    vi.mocked(ethers.Wallet.createRandom).mockReturnValue(mockWallet);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("successfully creates and saves a keypair", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const options = { output: "keypair.json", overwrite: false };

    keypairCreator.createKeypairAction(options);

    expect(keypairCreator["startSpinner"]).toHaveBeenCalledWith("Creating keypair...");
    expect(ethers.Wallet.createRandom).toHaveBeenCalledTimes(1);
    expect(keypairCreator["getFilePath"]).toHaveBeenCalledWith("keypair.json");


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

    expect(keypairCreator["writeConfig"]).toHaveBeenCalledWith(
      "keyPairPath",
      "/mocked/path/keypair.json"
    );

    expect(keypairCreator["succeedSpinner"]).toHaveBeenCalledWith(
      "Keypair successfully created and saved to: /mocked/path/keypair.json"
    );
  });

  test("skips creation if file exists and overwrite is false", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const options = { output: "keypair.json", overwrite: false };

    keypairCreator.createKeypairAction(options);

    expect(ethers.Wallet.createRandom).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
    expect(keypairCreator["failSpinner"]).toHaveBeenCalledWith(
      "The file at /mocked/path/keypair.json already exists. Use the '--overwrite' option to replace it."
    );
  });

  test("overwrites the file if overwrite is true", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const options = { output: "keypair.json", overwrite: true };

    keypairCreator.createKeypairAction(options);

    expect(keypairCreator["startSpinner"]).toHaveBeenCalledWith("Creating keypair...");
    expect(ethers.Wallet.createRandom).toHaveBeenCalledTimes(1);
    expect(keypairCreator["getFilePath"]).toHaveBeenCalledWith("keypair.json");

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

    expect(keypairCreator["writeConfig"]).toHaveBeenCalledWith(
      "keyPairPath",
      "/mocked/path/keypair.json"
    );

    expect(keypairCreator["succeedSpinner"]).toHaveBeenCalledWith(
      "Keypair successfully created and saved to: /mocked/path/keypair.json"
    );
  });

  test("handles errors during keypair creation", () => {
    const mockError = new Error("Mocked write error");

    vi.mocked(writeFileSync).mockImplementation(() => {
      throw mockError;
    });

    keypairCreator.createKeypairAction({ output: "keypair.json", overwrite: true });

    expect(keypairCreator["failSpinner"]).toHaveBeenCalledWith("Failed to generate keypair:", mockError);
  });
});
