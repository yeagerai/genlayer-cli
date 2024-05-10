import util from "node:util";
import {ChildProcess, PromiseWithChild, exec} from "child_process";
import os from "os";
import open from "open";

import {RunningPlatform, AVAILABLE_PLATFORMS} from "@/lib/config/simulator";
import {MissingRequirementError} from "../errors/missingRequirement";

const asyncExec = util.promisify(exec);

export async function checkCommand(command: string, toolName: string): Promise<void> {
  const {stderr} = await asyncExec(command);
  if (stderr) {
    throw new MissingRequirementError(toolName);
  }
}

type ExecuteCommandResult = {
  stdout: string;
  stderr: string;
};

type ExecuteCommandInNewTerminalInput = {
  [key in RunningPlatform]: string;
};

export function executeCommand(
  cmdsByPlatform: ExecuteCommandInNewTerminalInput,
  toolName: string,
): Promise<ExecuteCommandResult> {
  try {
    const runningPlatform = getPlatform();
    const command = cmdsByPlatform[runningPlatform];
    return asyncExec(command);
  } catch (error: any) {
    throw new Error(`Error executing ${toolName}: ${error.message}`);
  }
}

export function executeCommandInNewTerminal(
  cmdsByPlatform: ExecuteCommandInNewTerminalInput,
): PromiseWithChild<{stdout: string; stderr: string}> {
  const runningPlatform = getPlatform();
  const command = cmdsByPlatform[runningPlatform];
  try {
    return asyncExec(command);
  } catch (error: any) {
    throw new Error(`Error executing command ${command}`);
  }
}

export function getHomeDirectory(): string {
  return os.homedir();
}

function getPlatform(): RunningPlatform {
  const currentPlatform = process.platform as RunningPlatform;
  if (!AVAILABLE_PLATFORMS.includes(currentPlatform)) {
    throw new Error(`Unsupported platform: ${currentPlatform}`);
  }
  return currentPlatform;
}

export function openUrl(url: string): Promise<ChildProcess> {
  return open(url);
}
