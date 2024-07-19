import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import {exec} from "child_process";
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
} from "../config/simulator";
import {
  checkCommand,
  getHomeDirectory,
  executeCommand,
  openUrl,
  listDockerContainers,
  stopDockerContainer,
  removeDockerContainer,
  listDockerImages,
  removeDockerImage,
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

  private async getDockerVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec("docker --version", (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting Docker version: ${stderr}`);
        } else {
          const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            resolve(versionMatch[1]);
          } else {
            reject("Could not parse Docker version");
          }
        }
      });
    });
  }

  private async checkDockerVersion(minVersion: string): Promise<void> {
    const dockerVersion = await this.getDockerVersion();
    if (!semver.satisfies(dockerVersion, `>=${minVersion}`)) {
      throw new Error(`Docker version ${minVersion} or higher is required. You have ${dockerVersion}.`);
    }
  }

  private async getNodeVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec("node --version", (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting Node.js version: ${stderr}`);
        } else {
          const versionMatch = stdout.match(/v(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            resolve(versionMatch[1]);
          } else {
            reject("Could not parse Node.js version");
          }
        }
      });
    });
  }

  private async checkNodeVersion(minVersion: string): Promise<void> {
    const nodeVersion = await this.getNodeVersion();
    if (!semver.satisfies(nodeVersion, `>=${minVersion}`)) {
      throw new Error(`Node.js version ${minVersion} or higher is required. You have ${nodeVersion}.`);
    }
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
    } catch (error: any) {
      if (!(error instanceof MissingRequirementError)) {
        throw error;
      }
    }

    try {
      await this.checkDockerVersion("25.0.0");
    } catch (error: any) {
      // console.error(error.message);
      if (!(error instanceof MissingRequirementError)) {
        throw error;
      }
    }

    try {
      await this.checkNodeVersion("21.0.0");
    } catch (error: any) {
      // console.error(error.message);
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

  public async downloadSimulator(branch: string = "main"): Promise<DownloadSimulatorResultType> {
    const simulatorLocation = this.getSimulatorLocation();

    try {
      const gitCommand = `git clone -b ${branch} ${DEFAULT_REPO_GH_URL} ${simulatorLocation}`;
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

  public async updateSimulator(branch: string = "main"): Promise<boolean> {
    const simulatorLocation = this.getSimulatorLocation();
    const gitCleanCommand = `git -C  "${simulatorLocation}" clean -f`;
    const cleanCmdsByPlatform = {darwin: gitCleanCommand, win32: gitCleanCommand, linux: gitCleanCommand};
    await executeCommand(cleanCmdsByPlatform, "git");

    const gitFetchCommand = `git -C  "${simulatorLocation}" fetch`;
    const fetchCmdsByPlatform = {darwin: gitFetchCommand, win32: gitFetchCommand, linux: gitFetchCommand};
    await executeCommand(fetchCmdsByPlatform, "git");

    const gitCheckoutCommand = `git -C  "${simulatorLocation}" checkout ${branch}`;
    const checkoutCmdsByPlatform = {
      darwin: gitCheckoutCommand,
      win32: gitCheckoutCommand,
      linux: gitCheckoutCommand,
    };
    await executeCommand(checkoutCmdsByPlatform, "git");

    const gitPullCommand = `git -C  "${simulatorLocation}" pull`;
    const pullCmdsByPlatform = {darwin: gitPullCommand, win32: gitPullCommand, linux: gitPullCommand};
    await executeCommand(pullCmdsByPlatform, "git");
    return true;
  }

  public async pullOllamaModel(): Promise<boolean> {
    const simulatorLocation = this.getSimulatorLocation();
    const cmdsByPlatform = DEFAULT_PULL_OLLAMA_COMMAND(simulatorLocation);
    await executeCommand(cmdsByPlatform);
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
    return executeCommand(commandsByPlatform);
  }

  public async waitForSimulatorToBeReady(
    retries: number = STARTING_TIMEOUT_ATTEMPTS,
  ): Promise<WaitForSimulatorToBeReadyResultType> {
    console.log("Waiting for the simulator to start up...");
    try {
      const response = await rpcClient.request({method: "ping", params: []});

      //Compatibility with current simulator version
      if (response && (response.result.status === "OK" || response.result.data.status === "OK")) {
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
    const containers = await listDockerContainers();
    const genlayerContainers = containers.filter((container: string) =>
      container.startsWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX),
    );
    const containersStopPromises = genlayerContainers.map((container: string) =>
      stopDockerContainer(container),
    );
    await Promise.all(containersStopPromises);

    const containersRemovePromises = genlayerContainers.map((container: string) =>
      removeDockerContainer(container),
    );
    await Promise.all(containersRemovePromises);

    return true;
  }

  public async resetDockerImages(): Promise<boolean> {
    const images = await listDockerImages();
    const genlayerImages = images.filter((image: string) =>
      image.startsWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX),
    );
    const imagesRemovePromises = genlayerImages.map((image: string) => removeDockerImage(image));
    await Promise.all(imagesRemovePromises);

    return true;
  }
}

export default new SimulatorService();
