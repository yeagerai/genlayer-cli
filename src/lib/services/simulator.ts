import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

import {rpcClient} from "../clients/jsonRpcClient";
import {
  DEFAULT_REPO_GH_URL,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  DEFAULT_PULL_OLLAMA_COMMAND,
  STARTING_TIMEOUT_WAIT_CYLCE,
  STARTING_TIMEOUT_ATTEMPTS,
  AI_PROVIDERS_CONFIG,
  AiProviders,
} from "../config/simulator";
import {
  checkCommand,
  getHomeDirectory,
  executeCommand,
  executeCommandInNewTerminal,
  openUrl,
} from "../clients/system";
import {MissingRequirementError} from "../errors/missingRequirement";

import {
  ISimulatorService,
  DownloadSimulatorResultType,
  WaitForSimulatorToBeReadyResultType,
  InitializeDatabaseResultType,
} from "../interfaces/ISimulatorService";

function sleep(millliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millliseconds));
}

export class SimulatorService implements ISimulatorService {
  public getSimulatorLocation(): string {
    return path.join(getHomeDirectory(), "genlayer-simulator");
  }

  public readEnvConfigValue(key: string): string {
    const simulatorLocation = this.getSimulatorLocation();
    const envFilePath = path.join(simulatorLocation, ".env");
    // Transform the config string to object
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath, "utf8"));
    return envConfig[key];
  }

  public addConfigToEnvFile(newConfig: Record<string, string>): void {
    const simulatorLocation = this.getSimulatorLocation();
    const envFilePath = path.join(simulatorLocation, ".env");

    // Create a backup of the original .env file
    fs.writeFileSync(`${envFilePath}.bak`, fs.readFileSync(envFilePath));

    // Transform the config string to object
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath, "utf8"));
    Object.keys(newConfig).forEach(key => {
      envConfig[key] = newConfig[key];
    });

    // Transform the updated config object back into a string
    const updatedConfig = Object.keys(envConfig)
      .map(key => {
        return `${key}=${envConfig[key]}`;
      })
      .join("\n");

    // Write the new .env file
    fs.writeFileSync(envFilePath, updatedConfig);
  }

  public async checkRequirements(): Promise<Record<string, boolean>> {
    const requirementsInstalled = {
      git: false,
      docker: false,
    };

    try {
      await checkCommand("git --version", "git");
      requirementsInstalled.git = true;
    } catch (error) {
      if (!(error instanceof MissingRequirementError)) {
        throw error;
      }
    }
    try {
      await checkCommand("docker --version", "docker");
      requirementsInstalled.docker = true;
    } catch (error) {
      if (!(error instanceof MissingRequirementError)) {
        throw error;
      }
    }

    return requirementsInstalled;
  }

  public async downloadSimulator(): Promise<DownloadSimulatorResultType> {
    const simulatorLocation = this.getSimulatorLocation();

    try {
      const gitCommand = `git clone ${DEFAULT_REPO_GH_URL} ${simulatorLocation}`;
      const cmdsByPlatform = {darwin: gitCommand, win32: gitCommand, linux: gitCommand};
      await executeCommand(cmdsByPlatform, "git");
    } catch (error: any) {
      const simulatorLocationExists = fs.existsSync(simulatorLocation);
      if (simulatorLocationExists) {
        return {wasInstalled: true};
      }
      throw error;
    }
    return {wasInstalled: false};
  }

  public async updateSimulator(): Promise<DownloadSimulatorResultType> {
    const simulatorLocation = this.getSimulatorLocation();
    const gitCommand = `git -C  "${simulatorLocation}" pull`;
    const cmdsByPlatform = {darwin: gitCommand, win32: gitCommand, linux: gitCommand};
    await executeCommand(cmdsByPlatform, "git");
    return {wasInstalled: false};
  }

  public async pullOllamaModel(): Promise<boolean> {
    const simulatorLocation = this.getSimulatorLocation();
    const cmdsByPlatform = DEFAULT_PULL_OLLAMA_COMMAND(simulatorLocation);
    await executeCommandInNewTerminal(cmdsByPlatform);
    return true;
  }

  public async configSimulator(newConfig: Record<string, string>): Promise<boolean> {
    const simulatorLocation = this.getSimulatorLocation();
    const envExample = path.join(simulatorLocation, ".env.example");
    const envFilePath = path.join(simulatorLocation, ".env");
    fs.copyFileSync(envExample, envFilePath);
    this.addConfigToEnvFile(newConfig);
    return true;
  }

  public runSimulator(): Promise<{stdout: string; stderr: string}> {
    const simulatorLocation = this.getSimulatorLocation();
    const commandsByPlatform = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorLocation);
    return executeCommandInNewTerminal(commandsByPlatform);
  }

  public async waitForSimulatorToBeReady(
    retries: number = STARTING_TIMEOUT_ATTEMPTS,
  ): Promise<WaitForSimulatorToBeReadyResultType> {
    console.log("Waiting for the simulator to start up...");
    try {
      const response = await rpcClient.request({method: "ping", params: []});
      if (response && response.result.status === "OK") {
        return {initialized: true};
      }
      if (retries > 0) {
        await sleep(STARTING_TIMEOUT_WAIT_CYLCE);
        return this.waitForSimulatorToBeReady(retries - 1);
      }
    } catch (error: any) {
      if (
        (error.name === "FetchError" ||
          error.message.includes("Fetch Error") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("socket hang up")) &&
        retries > 0
      ) {
        await sleep(STARTING_TIMEOUT_WAIT_CYLCE * 2);
        return this.waitForSimulatorToBeReady(retries - 1);
      }
      return {initialized: false, errorCode: "ERROR", errorMessage: error.message};
    }

    return {initialized: false, errorCode: "TIMEOUT"};
  }

  public clearAccountsAndTransactionsDatabase(): Promise<any> {
    return rpcClient.request({method: "clear_account_and_transactions_tables", params: []});
  }

  public async initializeDatabase(): Promise<InitializeDatabaseResultType> {
    const createResponse = await rpcClient.request({method: "create_db", params: []});
    const tablesResponse = await rpcClient.request({method: "create_tables", params: []});
    return {createResponse, tablesResponse};
  }

  public createRandomValidators(numValidators: number, llmProviders: AiProviders[]): Promise<any> {
    return rpcClient.request({
      method: "create_random_validators",
      params: [numValidators, 1, 10, llmProviders],
    });
  }

  public deleteAllValidators(): Promise<any> {
    return rpcClient.request({method: "delete_all_validators", params: []});
  }

  public getAiProvidersOptions(withHint: boolean = true): Array<{name: string; value: string}> {
    return Object.values(AI_PROVIDERS_CONFIG).map(providerConfig => {
      return {
        name: `${providerConfig.name}${withHint ? ` ${providerConfig.hint}` : ""}`,
        value: providerConfig.cliOptionValue,
      };
    });
  }

  public getFrontendUrl(): string {
    const frontendPort = this.readEnvConfigValue("FRONTEND_PORT");
    return `http://localhost:${frontendPort}`;
  }

  public async openFrontend(): Promise<boolean> {
    await openUrl(this.getFrontendUrl());
    return true;
  }
}

export default new SimulatorService();
