import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import fs from "fs";
import { createClient, createAccount } from "genlayer-js";
import { DeployAction, DeployOptions } from "../../src/commands/contracts/deploy";
import { getPrivateKey } from "../../src/lib/accounts/getPrivateKey";

vi.mock("fs");
vi.mock("genlayer-js");
vi.mock("../../src/lib/accounts/getPrivateKey");

describe("Deploy Action", () => {
  let deployer: DeployAction;
  const mockClient = {
    deployContract: vi.fn(),
    waitForTransactionReceipt: vi.fn()
  };

  const mockPrivateKey = "mocked_private_key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockClient as any);
    vi.mocked(createAccount).mockReturnValue({ privateKey: mockPrivateKey } as any);
    vi.mocked(getPrivateKey).mockReturnValue(mockPrivateKey);
    deployer = new DeployAction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads contract code successfully", () => {
    const contractPath = "/mocked/contract/path";
    const contractContent = "contract code";
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(contractContent);

    const result = deployer["readContractCode"](contractPath);

    expect(fs.existsSync).toHaveBeenCalledWith(contractPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(contractPath, "utf-8");
    expect(result).toBe(contractContent);
  });

  test("throws error if contract file is missing", () => {
    const contractPath = "/mocked/contract/path";
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => deployer["readContractCode"](contractPath)).toThrowError(
      `Contract file not found: ${contractPath}`
    );
    expect(fs.existsSync).toHaveBeenCalledWith(contractPath);
  });


  test("deploys contract with args", async () => {
    const options: DeployOptions = {
      contract: "/mocked/contract/path",
      args: [1, 2, 3],
    };
    const contractContent = "contract code";

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(contractContent);
    vi.mocked(mockClient.deployContract).mockResolvedValue("mocked_tx_hash");
    vi.mocked(mockClient.waitForTransactionReceipt).mockResolvedValue({data: {contractAddress: '0xdasdsadasdasdada'}});

    await deployer.deploy(options);

    expect(fs.readFileSync).toHaveBeenCalledWith(options.contract, "utf-8");
    expect(mockClient.deployContract).toHaveBeenCalledWith({
      code: contractContent,
      args: [1, 2, 3],
      leaderOnly: false,
    });
    expect(mockClient.deployContract).toHaveResolvedWith("mocked_tx_hash");
  });

  test("throws error for both args and kwargs", async () => {
    const options: DeployOptions = {
      contract: "/mocked/contract/path",
      args: [1, 2, 3],
      kwargs: "key1=value1,key2=42",
    };

    await expect(deployer.deploy(options)).rejects.toThrowError(
      "Invalid usage: Please specify either `args` or `kwargs`, but not both."
    );

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(mockClient.deployContract).not.toHaveBeenCalled();
  });

  test("throws error for missing contract", async () => {
    const options: DeployOptions = {
    };

    await deployer.deploy(options);

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(mockClient.deployContract).not.toHaveBeenCalled();
  });

  test("handles deployment errors", async () => {
    const options: DeployOptions = {
      contract: "/mocked/contract/path",
      args: [1, 2, 3],
    };
    const contractContent = "contract code";

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(contractContent);
    vi.mocked(mockClient.deployContract).mockRejectedValue(
      new Error("Mocked deployment error")
    );

    await expect(deployer.deploy(options)).rejects.toThrowError(
      "Contract deployment failed."
    );

    expect(fs.readFileSync).toHaveBeenCalledWith(options.contract, "utf-8");
    expect(mockClient.deployContract).toHaveBeenCalled();
  });

  test("throws error if contract code is empty", async () => {
    const options: DeployOptions = {
      contract: "/mocked/contract/path",
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("");

    await deployer.deploy(options);

    expect(fs.existsSync).toHaveBeenCalledWith(options.contract);
    expect(fs.readFileSync).toHaveBeenCalledWith(options.contract, "utf-8");
    expect(mockClient.deployContract).not.toHaveBeenCalled();
  });
});
