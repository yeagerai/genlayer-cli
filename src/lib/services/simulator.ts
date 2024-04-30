import * as fs from "fs";
import * as dotenv from "dotenv";

import {rpcClient} from "@/lib/clients/jsonRpcClient";
import {
  DEFAULT_REPO_GH_URL,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  DEFAULT_CONFIG_SIMULATOR_COMMAND,
  DEFAULT_RUN_OLLAMA_COMMAND,
  STARTING_TIMEOUT_WAIT_CYLCE,
  STARTING_TIMEOUT_ATTEMPTS,
  AI_PROVIDERS_CONFIG,
} from "@/lib/config/simulator";
import {
  checkCommand,
  getHomeDirectory,
  executeCommand,
  executeCommandInNewTerminal,
} from "@/lib/clients/system";
import {MissingRequirementError} from "../errors/missingRequirement";

// Private helper functions
function getSimulatorLocation(): string {
  return `${getHomeDirectory()}/genlayer-simulator`;
}

function sleep(millliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millliseconds));
}

function addConfigToEnvFile(newConfig: Record<string, string>): void {
  const simulatorLocation = getSimulatorLocation();
  const envFilePath = `${simulatorLocation}/.env`;

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

// Public functions
export async function checkRequirements(): Promise<Record<string, boolean>> {
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

type DownloadSimulatorResultType = {
  wasInstalled: boolean;
};

export async function downloadSimulator(): Promise<DownloadSimulatorResultType> {
  const simulatorLocation = getSimulatorLocation();

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

export async function updateSimulator(): Promise<DownloadSimulatorResultType> {
  const simulatorLocation = getSimulatorLocation();
  const gitCommand = `cd ${simulatorLocation} && git pull`;
  const cmdsByPlatform = {darwin: gitCommand, win32: gitCommand, linux: gitCommand};
  await executeCommand(cmdsByPlatform, "git");
  return {wasInstalled: false};
}

export async function runOllamaModel(): Promise<boolean> {
  const simulatorLocation = getSimulatorLocation();
  const cmdsByPlatform = DEFAULT_RUN_OLLAMA_COMMAND(simulatorLocation);
  await executeCommandInNewTerminal(cmdsByPlatform);
  return true;
}

export async function configSimulator(newConfig: Record<string, string>): Promise<boolean> {
  const simulatorLocation = getSimulatorLocation();
  const commandsByPlatform = DEFAULT_CONFIG_SIMULATOR_COMMAND(simulatorLocation);
  await executeCommand(commandsByPlatform, "copy (cp)");
  addConfigToEnvFile(newConfig);
  return true;
}

export function runSimulator(): Promise<{stdout: string; stderr: string}> {
  const simulatorLocation = getSimulatorLocation();
  const commandsByPlatform = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorLocation);
  return executeCommandInNewTerminal(commandsByPlatform);
}

type WaitForSimulatorToBeReadyResultType = {
  initialized: boolean;
  error?: "TIMEOUT" | "ERROR";
};

export async function waitForSimulatorToBeReady(
  retries: number = STARTING_TIMEOUT_ATTEMPTS,
): Promise<WaitForSimulatorToBeReadyResultType> {
  console.log("Waiting for Simulator to be ready...:");
  try {
    const response = await rpcClient.request({method: "ping", params: []});
    if (response && response.result.status === "OK") {
      return {initialized: true};
    }
    if (retries > 0) {
      await sleep(STARTING_TIMEOUT_WAIT_CYLCE);
      return waitForSimulatorToBeReady(retries - 1);
    }
  } catch (error: any) {
    if ((error.message.includes("ECONNREFUSED") || error.message.includes("socket hang up")) && retries > 0) {
      await sleep(STARTING_TIMEOUT_WAIT_CYLCE * 2);
      return waitForSimulatorToBeReady(retries - 1);
    }
    return {initialized: false, error: "ERROR"};
  }

  return {initialized: false, error: "TIMEOUT"};
}

export function clearDatabaseTables(): Promise<any> {
  return rpcClient.request({method: "clear_tables", params: []});
}

type InitializeDatabaseResultType = {
  createResponse: any;
  tablesResponse: any;
};

export async function initializeDatabase(): Promise<InitializeDatabaseResultType> {
  const createResponse = await rpcClient.request({method: "create_db", params: []});
  const tablesResponse = await rpcClient.request({method: "create_tables", params: []});
  return {createResponse, tablesResponse};
}

export function createRandomValidators(): Promise<any> {
  return rpcClient.request({method: "create_random_validators", params: [10, 1, 10]});
}

export function deleteAllValidators(): Promise<any> {
  return rpcClient.request({method: "delete_all_validators", params: []});
}

export function getAiProvidersOptions(): Array<{name: string; value: string}> {
  return Object.values(AI_PROVIDERS_CONFIG).map(providerConfig => {
    return {name: providerConfig.name, value: providerConfig.cliOptionValue};
  });
}
