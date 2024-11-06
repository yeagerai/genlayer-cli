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
  stopDockerContainer,
  removeDockerContainer, listDockerContainers,
} from "../../src/lib/clients/system";
import {
  DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX,
  VERSION_REQUIREMENTS,
} from "../../src/lib/config/simulator";
import {
  STARTING_TIMEOUT_ATTEMPTS,
  DEFAULT_RUN_SIMULATOR_COMMAND,
  DEFAULT_RUN_DOCKER_COMMAND,
  DEFAULT_PULL_OLLAMA_COMMAND
} from "../../src/lib/config/simulator";
import { rpcClient } from "../../src/lib/clients/jsonRpcClient";
import * as semver from "semver";


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

  test("should return the correct simulator location path", () => {
    const expectedPath = "/mock/home/genlayer-simulator";
    simulatorService.setSimulatorLocation("/mock/home/genlayer-simulator");
    const simulatorLocation = simulatorService.getSimulatorLocation();
    expect(simulatorLocation).toBe(expectedPath);
  });

  test("should read the correct frontend URL from .env config", () => {
    const mockEnvFilePath = "/mock/home/genlayer-simulator/.env";
    const mockEnvContent = "FRONTEND_PORT=8080";
    const mockEnvConfig = { FRONTEND_PORT: "8080" };
    vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);
    vi.mocked(dotenv.parse).mockReturnValue(mockEnvConfig);
    simulatorService.setSimulatorLocation("/mock/home/genlayer-simulator");
    const frontendUrl = simulatorService.getFrontendUrl();
    expect(frontendUrl).toBe("http://localhost:8080");
    expect(fs.readFileSync).toHaveBeenCalledWith(mockEnvFilePath, "utf8");
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

  test("should download simulator if not already installed", async () => {
    const result = await simulatorService.downloadSimulator();
    expect(result.wasInstalled).toBe(false);
    expect(executeCommand).toHaveBeenCalled();
  });

  test("should skip download if simulator is already installed", async () => {
    vi.mocked(executeCommand).mockRejectedValueOnce(new Error("Mocked command error"));
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const result = await simulatorService.downloadSimulator();
    expect(result.wasInstalled).toBe(true);
    expect(executeCommand).toHaveBeenCalled();
    expect(fs.existsSync).toHaveBeenCalled();
  });

  test("should return initialized true when simulator responds with OK", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: {status: 'OK'} });
    const result = await simulatorService.waitForSimulatorToBeReady(STARTING_TIMEOUT_ATTEMPTS);
    expect(result).toEqual({ initialized: true });
    expect(rpcClient.request).toHaveBeenCalledWith({ method: "ping", params: [] });
  });

  test("should return initialized true when simulator responds with OK (different json structure)", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: {data: {status: 'OK'}} });
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

  test("should execute the correct pull command based on simulator location", async () => {
    const expectedCommand = DEFAULT_PULL_OLLAMA_COMMAND("/mock/home/genlayer-simulator");
    vi.mocked(executeCommand).mockResolvedValueOnce({
      stdout: "success",
      stderr: "",
    });
    const result = await simulatorService.pullOllamaModel();
    expect(result).toBe(true);
    expect(executeCommand).toHaveBeenCalledWith(expectedCommand);
  });

  test("should execute the correct run simulator command based on simulator location", async () => {
    (executeCommand as Mock).mockResolvedValue({
      stdout: "Simulator started",
      stderr: "",
    });
    const result = await simulatorService.runSimulator();
    const expectedCommand = DEFAULT_RUN_SIMULATOR_COMMAND("/mock/home/genlayer-simulator");
    expect(executeCommand).toHaveBeenCalledWith(expectedCommand);
    expect(result).toEqual({ stdout: "Simulator started", stderr: "" });
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

  test("should throw an unexpected error when checking docker installation requirement", async () => {
    vi.mocked(checkCommand)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Unexpected docker error"));
    await expect(simulatorService.checkInstallRequirements()).rejects.toThrow("Unexpected docker error");
    const requirementsInstalled = { git: false, docker: false };
    expect(requirementsInstalled.docker).toBe(false);
  });

  test("should stop and remove Docker containers with the specified prefix", async () => {
    const mockContainers = [
      DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "1",
      DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "2"
    ];
    vi.mocked(listDockerContainers).mockResolvedValue(mockContainers);
    vi.mocked(stopDockerContainer).mockResolvedValue(undefined);
    vi.mocked(removeDockerContainer).mockResolvedValue(undefined);
    const result = await simulatorService.resetDockerContainers();
    expect(result).toBe(true);
    expect(stopDockerContainer).toHaveBeenCalledWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "1");
    expect(stopDockerContainer).toHaveBeenCalledWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "2");
    expect(removeDockerContainer).toHaveBeenCalledWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "1");
    expect(removeDockerContainer).toHaveBeenCalledWith(DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX + "2");
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

  test("should throw an error if executeCommand fails and simulator location does not exist", async () => {
    const mockError = new Error("git clone failed");
    vi.mocked(executeCommand).mockRejectedValueOnce(mockError);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await expect(simulatorService.downloadSimulator()).rejects.toThrow("git clone failed");
    expect(executeCommand).toHaveBeenCalled();
    expect(fs.existsSync).toHaveBeenCalledWith("/mock/home/genlayer-simulator");
  });

  test("should call executeCommand if docker ps command fails", async () => {
    vi.mocked(checkCommand)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("docker ps failed"));
    vi.mocked(executeCommand).mockResolvedValueOnce({
      stdout: '',
      stderr: ''
    });
    const result = await simulatorService.checkInstallRequirements();
    expect(executeCommand).toHaveBeenCalledWith(DEFAULT_RUN_DOCKER_COMMAND);
    expect(result.docker).toBe(true);
    expect(result.git).toBe(true);
  });

  test("should update envConfig with newConfig values", () => {
    const envFilePath = path.join("/mock/home/genlayer-simulator", ".env");
    const originalEnvContent = "KEY1=value1\nKEY2=value2";
    const envConfig = { KEY1: "value1", KEY2: "value2" };
    const newConfig = { KEY2: "new_value2", KEY3: "value3" };
    vi.mocked(fs.readFileSync)
      .mockReturnValueOnce(originalEnvContent)
      .mockReturnValueOnce(originalEnvContent);
    vi.mocked(dotenv.parse).mockReturnValue(envConfig);
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");
    simulatorService["addConfigToEnvFile"](newConfig);
    expect(envConfig).toEqual({
      KEY1: "value1",
      KEY2: "new_value2",
      KEY3: "value3",
    });
    expect(writeFileSyncSpy).toHaveBeenCalledWith(`${envFilePath}.bak`, originalEnvContent);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      envFilePath,
      "KEY1=value1\nKEY2=new_value2\nKEY3=value3"
    );
  });

  test("should return providers without errors", () => {
    expect(simulatorService.getAiProvidersOptions(true)).toEqual(expect.any(Array));
    expect(simulatorService.getAiProvidersOptions(false)).toEqual(expect.any(Array));
  });

});
