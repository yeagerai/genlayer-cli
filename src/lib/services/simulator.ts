import {rpcClient} from "@/lib/clients/jsonRpcClient";
import {
  DEFAULT_REPO_GH_URL,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  STARTING_TIMEOUT_WAIT_CYLCE,
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
    if (error.toString().includes("already exists and is not an empty directory")) {
      return {wasInstalled: true};
    }
    throw error;
  }
  return {wasInstalled: false};
}

export function runSimulator(): Promise<{stdout: string; stderr: string}> {
  const simulatorLocation = getSimulatorLocation();
  const commandsByPlatform = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorLocation);
  return executeCommandInNewTerminal(commandsByPlatform);
}

export async function waitForSimulatorToBeReady(retries: number = 10): Promise<boolean> {
  const response = await rpcClient.request({method: "ping", params: []});
  if (response) {
    return true;
  }
  if (retries > 0) {
    await sleep(STARTING_TIMEOUT_WAIT_CYLCE);
    return waitForSimulatorToBeReady(retries - 1);
  }

  return false;
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
