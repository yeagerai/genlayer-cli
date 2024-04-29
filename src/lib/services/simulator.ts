import * as fs from "fs";

import {rpcClient} from "@/lib/clients/jsonRpcClient";
import {
  DEFAULT_REPO_GH_URL,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  STARTING_TIMEOUT_WAIT_CYLCE,
  STARTING_TIMEOUT_ATTEMPTS,
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
    await executeCommand(`git clone ${DEFAULT_REPO_GH_URL} ${simulatorLocation}`, "git");
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
  await executeCommand(`cd ${simulatorLocation} && git pull`, "git");
  return {wasInstalled: false};
}

export function runSimulator(): Promise<{stdout: string; stderr: string}> {
  const simulatorLocation = getSimulatorLocation();
  const commandsByPlatform = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorLocation);
  return executeCommandInNewTerminal(commandsByPlatform);
}

export async function waitForSimulatorToBeReady(
  retries: number = STARTING_TIMEOUT_ATTEMPTS,
): Promise<boolean> {
  console.log("🚀 ~ waitForSimulatorToBeReady ~ retries:", retries);
  try {
    const response = await rpcClient.request({method: "ping", params: []});
    console.log("🚀 ~ waitForSimulatorToBeReady ~ response:", response);
    if (response && response.result.status === "OK") {
      return true;
    }
    if (retries > 0) {
      await sleep(STARTING_TIMEOUT_WAIT_CYLCE);
      return waitForSimulatorToBeReady(retries - 1);
    }
  } catch (error: any) {
    console.log("🚀 ~ error:", error);
    if ((error.message.includes("ECONNREFUSED") || error.message.includes("socket hang up")) && retries > 0) {
      await sleep(STARTING_TIMEOUT_WAIT_CYLCE * 2);
      return waitForSimulatorToBeReady(retries - 1);
    }
  }

  return false;
}

type InitializeDatabaseResultType = {
  createResponse: any;
  tablesResponse: any;
};

export function clearDatabaseTables(): Promise<any> {
  return rpcClient.request({method: "clear_tables", params: []});
}

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
