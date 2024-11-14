import Docker from "dockerode"
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import * as semver from "semver";

import {rpcClient} from "../clients/jsonRpcClient";
import {
  DEFAULT_REPO_GH_URL,
  DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  DEFAULT_RUN_DOCKER_COMMAND,
  DEFAULT_PULL_OLLAMA_COMMAND,
  STARTING_TIMEOUT_WAIT_CYLCE,
  STARTING_TIMEOUT_ATTEMPTS,
  AI_PROVIDERS_CONFIG,
  AiProviders,
  VERSION_REQUIREMENTS,
} from "../config/simulator";
import {
  checkCommand,
  getVersion,
  executeCommand,
  openUrl,
} from "../clients/system";
import {MissingRequirementError} from "../errors/missingRequirement";

import {
  ISimulatorService,
  DownloadSimulatorResultType,
  WaitForSimulatorToBeReadyResultType,
} from "../interfaces/ISimulatorService";
import {VersionRequiredError} from "../errors/versionRequired";

const docker = new Docker();

function sleep(millliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millliseconds));
}

export class SimulatorService implements ISimulatorService {
  public simulatorLocation: string;

  constructor() {
    this.simulatorLocation = "";
  }

  public setSimulatorLocation(location: string): void {
    this.simulatorLocation = location;
  }

  public getSimulatorLocation(): string {
    return this.simulatorLocation;
  }

  private readEnvConfigValue(key: string): string {
    const envFilePath = path.join(this.simulatorLocation, ".env");
    // Transform the config string to object
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath, "utf8"));
    return envConfig[key];
  }

  private addConfigToEnvFile(newConfig: Record<string, string>): void {
    const envFilePath = path.join(this.simulatorLocation, ".env");

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

  public async checkInstallRequirements(): Promise<Record<string, boolean>> {
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
    } catch (error: any) {
      if (!(error instanceof MissingRequirementError)) {
        throw error;
      }
    }


    if (requirementsInstalled.docker) {
      try {
        await checkCommand("docker ps", "docker");
      } catch (error: any) {
        await executeCommand(DEFAULT_RUN_DOCKER_COMMAND);
      }
    }

    return requirementsInstalled;
  }

  public async checkVersionRequirements(): Promise<Record<string, string>> {
    const missingVersions = {
      docker: "",
      node: "",
    };

    try {
      await this.checkVersion(VERSION_REQUIREMENTS.node, "node");
    } catch (error: any) {
      missingVersions.node = VERSION_REQUIREMENTS.node;
      if (!(error instanceof VersionRequiredError)) {
        throw error;
      }
    }

    try {
      await this.checkVersion(VERSION_REQUIREMENTS.docker, "docker");
    } catch (error: any) {
      missingVersions.docker = VERSION_REQUIREMENTS.docker;
      if (!(error instanceof VersionRequiredError)) {
        throw error;
      }
    }

    return missingVersions;
  }

  public async checkVersion(minVersion: string, toolName: string): Promise<void> {
    const version = await getVersion(toolName);

    if (!semver.satisfies(version, `>=${minVersion}`)) {
      throw new VersionRequiredError(toolName, minVersion);
    }
  }

  public async downloadSimulator(branch: string = "main"): Promise<DownloadSimulatorResultType> {
    try {
      const gitCommand = `git clone -b ${branch} ${DEFAULT_REPO_GH_URL} ${this.simulatorLocation}`;
      const cmdsByPlatform = {darwin: gitCommand, win32: gitCommand, linux: gitCommand};
      await executeCommand(cmdsByPlatform, "git");
    } catch (error: any) {
      const simulatorLocationExists = fs.existsSync(this.simulatorLocation);
      if (simulatorLocationExists) {
        return {wasInstalled: true};
      }
      throw error;
    }
    return {wasInstalled: false};
  }

  public async updateSimulator(branch: string = "main"): Promise<boolean> {
    const gitCleanCommand = `git -C  "${this.simulatorLocation}" clean -f`;
    const cleanCmdsByPlatform = {darwin: gitCleanCommand, win32: gitCleanCommand, linux: gitCleanCommand};
    await executeCommand(cleanCmdsByPlatform, "git");

    const gitFetchCommand = `git -C  "${this.simulatorLocation}" fetch`;
    const fetchCmdsByPlatform = {darwin: gitFetchCommand, win32: gitFetchCommand, linux: gitFetchCommand};
    await executeCommand(fetchCmdsByPlatform, "git");

    const gitCheckoutCommand = `git -C  "${this.simulatorLocation}" checkout ${branch}`;
    const checkoutCmdsByPlatform = {
      darwin: gitCheckoutCommand,
      win32: gitCheckoutCommand,
      linux: gitCheckoutCommand,
    };
    await executeCommand(checkoutCmdsByPlatform, "git");

    const gitPullCommand = `git -C  "${this.simulatorLocation}" pull`;
    const pullCmdsByPlatform = {darwin: gitPullCommand, win32: gitPullCommand, linux: gitPullCommand};
    await executeCommand(pullCmdsByPlatform, "git");
    return true;
  }

  public async pullOllamaModel(): Promise<boolean> {
    const ollamaContainer = docker.getContainer("ollama");
    await ollamaContainer.exec({
      Cmd: ["ollama", "pull", "llama3"],
    });
    return true;
  }

  public async configSimulator(newConfig: Record<string, string>): Promise<boolean> {
    const envExample = path.join(this.simulatorLocation, ".env.example");
    const envFilePath = path.join(this.simulatorLocation, ".env");
    fs.copyFileSync(envExample, envFilePath);
    this.addConfigToEnvFile(newConfig);
    return true;
  }

  public runSimulator(): Promise<{stdout: string; stderr: string}> {
    const commandsByPlatform = DEFAULT_RUN_SIMULATOR_COMMAND(this.simulatorLocation);
    return executeCommand(commandsByPlatform);
  }

  public async waitForSimulatorToBeReady(
    retries: number = STARTING_TIMEOUT_ATTEMPTS,
  ): Promise<WaitForSimulatorToBeReadyResultType> {
    console.log("Waiting for the simulator to start up...");
    try {
      const response = await rpcClient.request({method: "ping", params: []});

      //Compatibility with current simulator version
      if (response?.result === "OK" || response?.result?.status === "OK" || response?.result?.data?.status === "OK") {
        return { initialized: true };
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

  public async resetDockerContainers(): Promise<boolean> {
    const containers = await docker.listContainers({ all: true });
    const genlayerContainers = containers.filter(container =>
      container.Names.some(name =>
        name.startsWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX)
      )
    );

    for (const containerInfo of genlayerContainers) {
      const container = docker.getContainer(containerInfo.Id);
      if (containerInfo.State === "running") {
        await container.stop();
      }
      await container.remove();
    }
    return true;
  }

  public async resetDockerImages(): Promise<boolean> {
    const images = await docker.listImages();
    const genlayerImages = images.filter(image =>
      image.RepoTags?.some(tag => tag.startsWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX))
    );

    for (const imageInfo of genlayerImages) {
      const image = docker.getImage(imageInfo.Id);
      await image.remove({force: true});
    }

    return true;
  }
}

export default new SimulatorService();
