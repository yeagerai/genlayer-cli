import util from "node:util";
import {ChildProcess, PromiseWithChild, exec} from "child_process";
import open from "open";

import {RunningPlatform, AVAILABLE_PLATFORMS} from "../config/simulator";
import {MissingRequirementError} from "../errors/missingRequirement";
import {VersionRequiredError} from "../errors/versionRequired";

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

type ExecuteCommandByPlatformInput = {
  [key in RunningPlatform]: string;
};

export function executeCommand(
  cmdsByPlatform: ExecuteCommandByPlatformInput,
  toolName?: string,
): PromiseWithChild<ExecuteCommandResult> {
  const runningPlatform = getPlatform();
  const command = cmdsByPlatform[runningPlatform];
  try {
    return asyncExec(command);
  } catch (error: any) {
    throw new Error(`Error executing ${toolName || command}: ${error.message}.`);
  }
}

function getPlatform(): RunningPlatform {
  const currentPlatform = process.platform as RunningPlatform;
  if (!AVAILABLE_PLATFORMS.includes(currentPlatform)) {
    throw new Error(`Unsupported platform: ${currentPlatform}.`);
  }
  return currentPlatform;
}

export function openUrl(url: string): Promise<ChildProcess> {
  return open(url);
}

export async function getVersion(toolName: string): Promise<string> {
  try {
    const toolResponse = await asyncExec(`${toolName} --version`);

    if (toolResponse.stderr) {
      throw new Error(toolResponse.stderr);
    }

    try {
      const versionMatch = toolResponse.stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    } catch (err) {
      throw new Error(`Could not parse ${toolName} version.`);
    }
  } catch (error) {
    throw new Error(`Error getting ${toolName} version.`);
  }

  return "";
}

export async function listDockerContainers(): Promise<string[]> {
  try {
    const dockerResponse = await asyncExec("docker ps -a --format '{{.Names}}'");
    const dockerContainers = dockerResponse.stdout.split("\n");
    return dockerContainers;
  } catch (error) {
    throw new Error("Error listing Docker containers.");
  }
  return [];
}

export async function listDockerImages(): Promise<string[]> {
  try {
    const dockerResponse = await asyncExec("docker images --format '{{.Repository}}'");
    const dockerImages = dockerResponse.stdout.split("\n");
    return dockerImages;
  } catch (error) {
    throw new Error("Error listing Docker images.");
  }
  return [];
}

export async function stopDockerContainer(containerName: string): Promise<void> {
  try {
    await asyncExec(`docker stop ${containerName}`);
  } catch (error) {
    throw new Error(`Error stopping Docker container ${containerName}.`);
  }
}

export async function removeDockerContainer(containerName: string) {
  try {
    await asyncExec(`docker rm ${containerName}`);
  } catch (error) {
    throw new Error(`Error removing container ${containerName}.`);
  }
}

export async function removeDockerImage(imageName: string) {
  try {
    await asyncExec(`docker rmi ${imageName}`);
  } catch (error) {
    throw new Error(`Error removing image ${imageName}.`);
  }
}
