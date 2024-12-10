import fs from "fs";
import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { getPrivateKey } from "../../lib/accounts/getPrivateKey";

export interface DeployOptions {
  contract?: string;
  // network: string;
  args?: any[];
  kwargs?: string;
}

export class DeployAction {
  private genlayerClient: GenLayerClient<typeof simulator>;

  constructor() {
    this.genlayerClient = createClient({
      chain: simulator,
      endpoint: process.env.VITE_JSON_RPC_SERVER_URL,
      account: createAccount(getPrivateKey() as any),
    });
  }

  private readContractCode(contractPath: string): string {
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    return fs.readFileSync(contractPath, "utf-8");
  }

  private parseKeyValueArgs(input: string): Record<string, any> {
    const result: Record<string, any> = {};

    input.split(",").forEach((pair) => {
      const [key, value] = pair.split("=");

      if (!key || value === undefined) {
        throw new Error(`Invalid key-value pair: "${pair}". Expected format: KEY=VALUE.`);
      }

      result[key.trim()] = isNaN(Number(value)) ? value.trim() : Number(value);
    });

    return result;
  }

  async deploy(options: DeployOptions): Promise<void> {

    const argsUsed = options.args && options.args.length > 0;
    const kwargsUsed = options.kwargs && options.kwargs.trim() !== "";

    if (argsUsed && kwargsUsed) {
      throw new Error("Invalid usage: Please specify either `args` or `kwargs`, but not both.");
    }

    if (!options.contract) {
      console.error("No contract specified for deployment.");
      return;
    }

    const contractCode = this.readContractCode(options.contract);

    if (!contractCode) {
      console.error("Contract code is empty.");
      return;
    }

    const leaderOnly = false;
    let deployParams: any = { code: contractCode, leaderOnly };

    if (kwargsUsed && options.kwargs) {
      deployParams.kwargs = this.parseKeyValueArgs(options.kwargs);
    }else {
      deployParams.args = options.args;
    }

    console.log("Starting contract deployment...");
    console.log("Deployment Parameters:", deployParams);

    try {
      const result = await this.genlayerClient.deployContract(deployParams);

      console.log("Contract deployed successfully.");
      console.log("Transaction Hash:", result);
    } catch (error) {
      console.error("Error deploying contract:", error);
      throw new Error("Contract deployment failed.");
    }
  }
}
