import { describe, beforeEach, test, expect, vi, Mock } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import simulatorService from "../../src/lib/services/simulator";
import {
  getVersion,
  executeCommand,
  openUrl,
  checkCommand,
} from "../../src/lib/clients/system";
import {
  DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX,
  VERSION_REQUIREMENTS,
  STARTING_TIMEOUT_ATTEMPTS,
  DEFAULT_RUN_SIMULATOR_COMMAND,
} from "../../src/lib/config/simulator";
import { rpcClient } from "../../src/lib/clients/jsonRpcClient";
import * as semver from "semver";
import Docker from "dockerode";
import {VersionRequiredError} from "../../src/lib/errors/versionRequired";
import updateCheck from "update-check";

vi.mock("../../package.json", () => ({
  default: { version: "1.0.0", name: "genlayer" },
}));

vi.mock("update-check", () => ({
  default: vi.fn(),
}));
vi.mock("dockerode");
vi.mock("fs");
vi.mock("path");
vi.mock("dotenv");
vi.mock("semver", () => ({
  satisfies: vi.fn(),
}));
vi.mock("../../src/lib/clients/system", () => ({
  checkCommand: vi.fn(),
  getVersion: vi.fn(),
  executeCommand: vi.fn(),
  openUrl: vi.fn(),
  listDockerContainers: vi.fn(),
  stopDockerContainer: vi.fn(),
  removeDockerContainer: vi.fn(),
}));

vi.mock("../../src/lib/clients/jsonRpcClient", () => ({
  rpcClient: {
    request: vi.fn(),
  },
}));

describe("SimulatorService - Basic Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
  });


  test("should read the correct frontend URL from .env config", () => {
    const mockEnvContent = "FRONTEND_PORT=8080";
    const mockEnvConfig = { FRONTEND_PORT: "8080" };
    vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);
    vi.mocked(dotenv.parse).mockReturnValue(mockEnvConfig);
    const frontendUrl = simulatorService.getFrontendUrl();
    expect(frontendUrl).toBe("http://localhost:8080");
  });

  test("should check version requirements and return missing versions", async () => {
    vi.mocked(getVersion).mockResolvedValueOnce("12.0.0").mockResolvedValueOnce("18.0.0");
    vi.mocked(semver.satisfies).mockImplementation((version, range) => {
      if (range === VERSION_REQUIREMENTS.node) return version === "18.0.0";
      return false;
    });
    const missingVersions = await simulatorService.checkVersionRequirements();
    expect(missingVersions.node).toBe(VERSION_REQUIREMENTS.node);
    expect(missingVersions.docker).toBe(VERSION_REQUIREMENTS.docker);
  });

  test("should handle error when checkVersion throws VersionRequiredError", async () => {
    vi.mocked(getVersion).mockResolvedValueOnce("10.0.0");
    vi.mocked(semver.satisfies).mockReturnValue(false);
    await expect(simulatorService.checkVersion("14.0.0", "node")).rejects.toThrow();
  });


  test("should return initialized true when simulator responds with OK (result.status = OK)", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: {status: 'OK'} });
    const result = await simulatorService.waitForSimulatorToBeReady(STARTING_TIMEOUT_ATTEMPTS);
    expect(result).toEqual({ initialized: true });
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "ping", params: [] });
  });

  test("should return initialized true when simulator responds with OK (result.data.status = OK)", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: {data: {status: 'OK'}} });
    const result = await simulatorService.waitForSimulatorToBeReady(STARTING_TIMEOUT_ATTEMPTS);
    expect(result).toEqual({ initialized: true });
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "ping", params: [] });
  });

  test("should return initialized true when simulator responds with OK (result = OK)", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: 'OK' });
    const result = await simulatorService.waitForSimulatorToBeReady(STARTING_TIMEOUT_ATTEMPTS);
    expect(result).toEqual({ initialized: true });
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "ping", params: [] });
  });

  test("should return initialized false with errorCode TIMEOUT after retries", async () => {
    vi.mocked(rpcClient.request).mockResolvedValue(undefined);
    const result = await simulatorService.waitForSimulatorToBeReady(1);
    expect(result).toEqual({ initialized: false, errorCode: "TIMEOUT" });
  });

  test("should return initialized false with errorCode ERROR on non-retryable error", async () => {
    const nonRetryableError = new Error("Unexpected error");
    vi.mocked(rpcClient.request).mockRejectedValue(nonRetryableError);
    const result = await simulatorService.waitForSimulatorToBeReady(STARTING_TIMEOUT_ATTEMPTS);
    expect(result).toEqual({ initialized: false, errorCode: "ERROR", errorMessage: nonRetryableError.message });
  });

  test("should execute the correct run simulator command based on simulator location", async () => {
    (executeCommand as Mock).mockResolvedValue({
      stdout: "Simulator started",
      stderr: "",
    });
    const result = await simulatorService.runSimulator();
    const expectedCommand = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorService.location, '');
    expect(executeCommand).toHaveBeenCalledWith(expectedCommand);
    expect(result).toEqual({ stdout: "Simulator started", stderr: "" });
  });

  test("should execute the correct run simulator command based on headless option", async () => {
    (executeCommand as Mock).mockResolvedValue({
      stdout: "Simulator started",
      stderr: "",
    });
    simulatorService.setComposeOptions(true)
    const commandOption = simulatorService.getComposeOptions();
    const result = await simulatorService.runSimulator();
    const expectedCommand = DEFAULT_RUN_SIMULATOR_COMMAND(simulatorService.location, commandOption);
    expect(executeCommand).toHaveBeenCalledWith(expectedCommand);
    expect(result).toEqual({ stdout: "Simulator started", stderr: "" });
  });

  test("should create a backup of the .env file and add new config", () => {
    const envFilePath = `/.env`;
    const originalEnvContent = "KEY1=value1\nKEY2=value2";
    const parsedEnvConfig = { KEY1: "value1", KEY2: "value2" };
    const newConfig = { KEY3: "value3", KEY2: "newValue2" };

    vi.mocked(fs.readFileSync).mockImplementation((filePath: any) => {
      if (filePath === envFilePath) return originalEnvContent;
      return "";
    });

    vi.mocked(dotenv.parse).mockReturnValue(parsedEnvConfig);
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    simulatorService.addConfigToEnvFile(newConfig);

    const expectedUpdatedContent = `KEY1=value1\nKEY2=newValue2\nKEY3=value3`;
    expect(writeFileSyncMock).toHaveBeenCalledWith(envFilePath, expectedUpdatedContent);
  });

  test("should handle empty .env file and add new config", () => {
    const envFilePath = `/.env`;
    const newConfig = { NEW_KEY: "newValue" };

    vi.mocked(fs.readFileSync).mockReturnValue("");
    vi.mocked(dotenv.parse).mockReturnValue({});
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    simulatorService.addConfigToEnvFile(newConfig);

    expect(writeFileSyncMock).toHaveBeenCalledWith(`${envFilePath}.bak`, "");
    const expectedUpdatedContent = `NEW_KEY=newValue`;
    expect(writeFileSyncMock).toHaveBeenCalledWith(envFilePath, expectedUpdatedContent);
  });

  test("should throw error when .env file does not exist", () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("File not found");
    });

    expect(() => simulatorService.addConfigToEnvFile({ KEY: "value" })).toThrow(
      "File not found"
    );
  });


  test("should open the frontend URL and return true", async () => {
    vi.spyOn(simulatorService, "getFrontendUrl").mockReturnValue("http://localhost:8080");
    const result = await simulatorService.openFrontend();
    expect(simulatorService.getFrontendUrl).toHaveBeenCalled();
    expect(openUrl).toHaveBeenCalledWith("http://localhost:8080");
    expect(result).toBe(true);
  });

  test("should call rpcClient.request with correct parameters and return the response", async () => {
    const mockResponse = { success: true };
    vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);
    const result = await simulatorService.deleteAllValidators();
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "delete_all_validators", params: [] });
    expect(result).toBe(mockResponse);
  });

  test("should return node missing version", async () => {
    const unexpectedError = new VersionRequiredError('node', VERSION_REQUIREMENTS.node);
    vi.spyOn(simulatorService, "checkVersion")
      .mockRejectedValueOnce(unexpectedError)
      .mockResolvedValueOnce();

    await expect(simulatorService.checkVersionRequirements()).resolves.toStrictEqual({
      "docker": "",
      "node": VERSION_REQUIREMENTS.node
    })
  });

  test("should return docker missing version", async () => {
    const unexpectedError = new VersionRequiredError('node', VERSION_REQUIREMENTS.docker);
    vi.spyOn(simulatorService, "checkVersion")
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(unexpectedError)

    await expect(simulatorService.checkVersionRequirements()).resolves.toStrictEqual({
      "docker": VERSION_REQUIREMENTS.docker,
      "node": ""
    })
  });

  test("should throw an unexpected error when checking node version requirements", async () => {
    const unexpectedError = new Error("Unexpected error (node)");
    vi.spyOn(simulatorService, "checkVersion").mockRejectedValueOnce(unexpectedError);
    await expect(simulatorService.checkVersionRequirements()).rejects.toThrow("Unexpected error (node)");
  });

  test("should throw an unexpected error when checking docker version requirements", async () => {
    vi.spyOn(simulatorService, "checkVersion")
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Unexpected error (docker)"));
    await expect(simulatorService.checkVersionRequirements()).rejects.toThrow("Unexpected error (docker)");
  });

  test("should throw an unexpected error when checking git installation requirement", async () => {
    vi.mocked(checkCommand).mockRejectedValueOnce(new Error("Unexpected git error"));
    await expect(simulatorService.checkInstallRequirements()).rejects.toThrow("Unexpected git error");
    const requirementsInstalled = { git: false, docker: false };
    expect(requirementsInstalled.git).toBe(false);
  });

  test("should retry when response is not 'OK' and reach sleep path", async () => {
    vi.mocked(rpcClient.request).mockResolvedValue({ result: { status: "NOT_OK" } });
    const result = await simulatorService.waitForSimulatorToBeReady(1);
    expect(result).toEqual({ initialized: false, errorCode: "TIMEOUT" });
  });

  test("should retry on fetch error and reach sleep path", async () => {
    const fetchError = new Error("Fetch Error");
    fetchError.name = "FetchError";
    vi.mocked(rpcClient.request).mockRejectedValue(fetchError);
    const result = await simulatorService.waitForSimulatorToBeReady(1);
    expect(result).toEqual({ initialized: false, errorCode: "ERROR", errorMessage: fetchError.message });
  });

  test("should call executeCommand if docker ps command fails", async () => {
    vi.mocked(checkCommand)
      .mockResolvedValueOnce(undefined)

    const result = await simulatorService.checkInstallRequirements();
    expect(result.docker).toBe(true);
  });


  test("should return providers without errors", () => {
    expect(simulatorService.getAiProvidersOptions(true)).toEqual(expect.any(Array));
    expect(simulatorService.getAiProvidersOptions(false)).toEqual(expect.any(Array));
  });

  test("clean simulator should success", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce('Success');
    await expect(simulatorService.cleanDatabase).not.toThrow();
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "sim_clearDbTables", params: [['current_state', 'transactions']] });
  });

});
describe("SimulatorService - Docker Tests", () => {
  let mockExec: Mock;
  let mockGetContainer: Mock;
  let mockListContainers: Mock;
  let mockListImages: Mock;
  let mockGetImage: Mock;
  let mockPing: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExec = vi.fn().mockResolvedValueOnce({});
    mockGetContainer = vi.mocked(Docker.prototype.getContainer);
    mockListContainers = vi.mocked(Docker.prototype.listContainers);
    mockListImages = vi.mocked(Docker.prototype.listImages);
    mockGetImage = vi.mocked(Docker.prototype.getImage);
    mockPing = vi.mocked(Docker.prototype.ping);
  });

  test("should handle errors during the execution of pullOllamaModel gracefully", async () => {
    const mockExec = vi.fn();
    const mockStart = vi.fn();

    mockExec.mockResolvedValue({
      start: mockStart,
    });

    const mockStream = {
      on: vi.fn((event, callback) => {
        if (event === "data") callback("Mock data chunk");
        if (event === "error") callback(new Error("Mock error during stream"));
      }),
    };

    mockStart.mockResolvedValue(mockStream);

    mockGetContainer.mockReturnValueOnce({
      exec: mockExec,
    } as unknown as Docker.Container);

    const result = await simulatorService.pullOllamaModel();

    expect(result).toBe(false);
    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(mockExec).toHaveBeenCalledWith({
      Cmd: ["ollama", "pull", "llama3"],
      AttachStdout: true,
      AttachStderr: true,
    });
    expect(mockStart).toHaveBeenCalledWith({ Detach: false, Tty: false });
    expect(mockStream.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  test("should successfully execute pullOllamaModel and return true", async () => {
    const mockExec = vi.fn();
    const mockStart = vi.fn();

    mockExec.mockResolvedValue({
      start: mockStart,
    });

    const mockStream = {
      on: vi.fn((event, callback) => {
        if (event === "data") callback("Mock data chunk");
        if (event === "end") callback();
      }),
    };

    mockStart.mockResolvedValue(mockStream);

    mockGetContainer.mockReturnValueOnce({
      exec: mockExec,
    } as unknown as Docker.Container);

    const result = await simulatorService.pullOllamaModel();

    expect(result).toBe(true);
    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(mockExec).toHaveBeenCalledWith({
      Cmd: ["ollama", "pull", "llama3"],
      AttachStdout: true,
      AttachStderr: true,
    });
    expect(mockStart).toHaveBeenCalledWith({ Detach: false, Tty: false });
    expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
  });


  test("should stop and remove Docker containers with the specified prefix", async () => {
    const mockContainers = [
      {
        Id: "container1",
        Names: [`${DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX}container1`],
        State: "running",
      },
      {
        Id: "container2",
        Names: [`${DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX}container2`],
        State: "exited",
      },
      {
        Id: "container3",
        Names: ["/unrelated-container"],
        State: "running",
      },
    ];

    mockListContainers.mockResolvedValue(mockContainers);

    const mockStop = vi.fn().mockResolvedValue(undefined);
    const mockRemove = vi.fn().mockResolvedValue(undefined);
    mockGetContainer.mockImplementation(() => ({
      stop: mockStop,
      remove: mockRemove,
    } as unknown as Docker.Container));

    const result = await simulatorService.resetDockerContainers();

    expect(result).toBe(true);
    expect(mockListContainers).toHaveBeenCalledWith({ all: true });

    // Ensure only the relevant containers were stopped and removed
    expect(mockGetContainer).toHaveBeenCalledWith("container1");
    expect(mockGetContainer).toHaveBeenCalledWith("container2");
    expect(mockGetContainer).not.toHaveBeenCalledWith("container3");

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledTimes(2);
  });

  test("should remove Docker images with the specified prefix", async () => {
    const mockImages = [
      {
        Id: "image1",
        RepoTags: [`${DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX}image1:latest`],
      },
      {
        Id: "image2",
        RepoTags: [`${DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX}image2:latest`],
      },
      {
        Id: "image3",
        RepoTags: ["unrelated-image:latest"],
      },
    ];

    mockListImages.mockResolvedValue(mockImages);

    const mockRemove = vi.fn().mockResolvedValue(undefined);
    mockGetImage.mockImplementation(() => ({
      remove: mockRemove,
    } as unknown as Docker.Image));

    const result = await simulatorService.resetDockerImages();

    expect(result).toBe(true);
    expect(mockListImages).toHaveBeenCalled();
    expect(mockGetImage).toHaveBeenCalledWith("image1");
    expect(mockGetImage).toHaveBeenCalledWith("image2");
    expect(mockGetImage).not.toHaveBeenCalledWith("image3");
    expect(mockRemove).toHaveBeenCalledTimes(2);
    expect(mockRemove).toHaveBeenCalledWith({ force: true });
  });

  test("should execute command when docker is installed but is not available", async () => {
    vi.mocked(checkCommand)
      .mockResolvedValueOnce(undefined)

    mockPing.mockRejectedValueOnce("");
    await simulatorService.checkInstallRequirements();
    expect(executeCommand).toHaveBeenCalledTimes(1);
  });

  test("should call execute command again to start docker service", async () => {
    vi.mocked(checkCommand)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(undefined);
    mockPing.mockRejectedValueOnce("");
    await expect(simulatorService.checkInstallRequirements()).resolves.toStrictEqual({ docker: true });
  });

  test("should warn the user when an update is available", async () => {
    const update = { latest: "1.1.0" };
    (updateCheck as any).mockResolvedValue(update);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await simulatorService.checkCliVersion();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `\nA new version (${update.latest}) is available! You're using version 1.0.0.\nRun npm install -g genlayer to update\n`
    );

    consoleWarnSpy.mockRestore();
  });

  test("should not warn the user when the CLI is up-to-date", async () => {
    const update = { latest: "1.0.0" };
    (updateCheck as any).mockResolvedValue(update);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await simulatorService.checkCliVersion();

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  test("should handle update-check returning undefined", async () => {
    (updateCheck as any).mockResolvedValue(undefined);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await simulatorService.checkCliVersion();

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});
