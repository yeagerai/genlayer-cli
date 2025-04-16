import fs from "fs";
import path from "path";
import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { getPrivateKey } from "../../lib/accounts/getPrivateKey";
import { BaseAction } from "../../lib/actions/BaseAction";
import { pathToFileURL } from "url";
import { TransactionStatus } from "genlayer-js/types";
import { buildSync } from "esbuild";

export interface DeployOptions {
  contract?: string;
  args?: any[];
}

export class DeployAction extends BaseAction {
  private genlayerClient: GenLayerClient<typeof simulator>;
  private readonly deployDir = path.resolve(process.cwd(), "deploy");

  constructor() {
    super();
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

  private async executeTsScript(filePath: string): Promise<void> {
    const outFile = filePath.replace(/\.ts$/, ".compiled.js");
    this.startSpinner(`Transpiling TypeScript file: ${filePath}`);
    try {
      buildSync({
        entryPoints: [filePath],
        outfile: outFile,
        bundle: false,
        platform: "node",
        format: "esm",
        target: "es2020",
        sourcemap: false,
      });
     await this.executeJsScript(filePath, outFile);
    } catch (error) {
      this.failSpinner(`Error executing: ${filePath}`, error);
    } finally {
      fs.unlinkSync(outFile);
    }
  }

  private async executeJsScript(filePath: string, transpiledFilePath?: string): Promise<void> {
    this.startSpinner(`Executing file: ${filePath}`);
    try {
      const module = await import(pathToFileURL(transpiledFilePath || filePath).href);
      if (!module.default || typeof module.default !== "function") {
        this.failSpinner(`No "default" function found in: ${filePath}`);
        return
      }
      await module.default(this.genlayerClient);
      this.succeedSpinner(`Successfully executed: ${filePath}`);
    } catch (error) {
      this.failSpinner(`Error executing: ${filePath}`, error);
    }
  }

  async deployScripts() {
    this.startSpinner("Searching for deploy scripts...");
    if (!fs.existsSync(this.deployDir)) {
      this.failSpinner("No deploy folder found.");
      return;
    }
    const files = fs.readdirSync(this.deployDir)
      .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
      .sort((a, b) => {
        const numA = parseInt(a.split("_")[0]);
        const numB = parseInt(b.split("_")[0]);

        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b);
      });

    if (files.length === 0) {
      this.failSpinner("No deploy scripts found.");
      return;
    }

    this.setSpinnerText(`Found ${files.length} deploy scripts. Executing...`);

    for (const file of files) {
      const filePath = path.resolve(this.deployDir, file);
      this.setSpinnerText(`Executing script: ${filePath}`);
      try {
        if (file.endsWith(".ts")) {
          await this.executeTsScript(filePath);
        } else {
          await this.executeJsScript(filePath);
        }
      } catch (error) {
        this.failSpinner(`Error executing script: ${filePath}`, error);
      }
    }
  }

  async deploy(options: DeployOptions): Promise<void> {
    try {
      this.startSpinner("Setting up the deployment environment...");
      await this.genlayerClient.initializeConsensusSmartContract();

      if (!options.contract) {
        this.failSpinner("No contract specified for deployment.");
        return;
      }
      this.setSpinnerText("Reading contract code...");
      const contractCode = this.readContractCode(options.contract);

      if (!contractCode) {
        this.failSpinner("Contract code is empty.");
        return;
      }

      const leaderOnly = false;
      const deployParams: any = { code: contractCode, args: options.args, leaderOnly };

      this.setSpinnerText("Starting contract deployment...");
      this.log("Deployment Parameters:", deployParams);

      const hash = (await this.genlayerClient.deployContract(deployParams)) as any;
      const result = await this.genlayerClient.waitForTransactionReceipt({
        hash,
        retries: 15,
        interval: 2000,
        status: TransactionStatus.ACCEPTED,
      });

      this.log("Deployment Receipt:", result);

      this.succeedSpinner("Contract deployed successfully.", {
        "Transaction Hash": hash,
        "Contract Address": result.data?.contract_address,
      });
    } catch (error) {
      this.failSpinner("Error deploying contract", error);
    }
  }
}
