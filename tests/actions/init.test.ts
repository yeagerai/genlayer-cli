import {vi, describe, beforeEach, afterEach, test, expect} from "vitest";
import inquirer from "inquirer";
import simulatorService from "../../src/lib/services/simulator";
import { initAction } from "../../src/commands/general/init";
import { tmpdir } from "os";
import {mkdtempSync} from "fs";
import {join} from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import {localnetCompatibleVersion} from "../../src/lib/config/simulator";
import { OllamaAction } from "../../src/commands/update/ollama";


vi.mock("fs");
vi.mock("dotenv");
vi.mock("../../src/commands/update/ollama")


const tempDir = mkdtempSync(join(tmpdir(), "test-initAction-"));
const defaultActionOptions = { numValidators: 5, branch: "main", location: tempDir, headless: false, resetDb: false, localnetVersion: localnetCompatibleVersion };

describe("init action", () => {
  let error: ReturnType<any>;
  let log: ReturnType<any>;
  let inquirerPrompt: ReturnType<any>;

  let simServCheckInstallRequirements: ReturnType<any>;
  let simServCheckVersionRequirements: ReturnType<any>;
  let simServResetDockerContainers: ReturnType<any>;
  let simServResetDockerImages: ReturnType<any>;
  let simServgetAiProvidersOptions: ReturnType<any>;
  let simServRunSimulator: ReturnType<any>;
  let simServWaitForSimulator: ReturnType<any>;
  let simServDeleteAllValidators: ReturnType<any>;
  let simServCreateRandomValidators: ReturnType<any>;
  let simServOpenFrontend: ReturnType<any>;
  let simGetSimulatorUrl: ReturnType<any>;
  let simAddConfigToEnvFile: ReturnType<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    error = vi.spyOn(console, "error").mockImplementation(() => {});
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    inquirerPrompt = vi.spyOn(inquirer, "prompt");

    simServCheckInstallRequirements = vi.spyOn(simulatorService, "checkInstallRequirements");
    simServCheckVersionRequirements = vi.spyOn(simulatorService, "checkVersionRequirements");
    simServResetDockerContainers = vi.spyOn(simulatorService, "resetDockerContainers");
    simServResetDockerImages = vi.spyOn(simulatorService, "resetDockerImages");
    simServgetAiProvidersOptions = vi.spyOn(simulatorService, "getAiProvidersOptions");
    simServRunSimulator = vi.spyOn(simulatorService, "runSimulator");
    simServWaitForSimulator = vi.spyOn(simulatorService, "waitForSimulatorToBeReady");
    simServDeleteAllValidators = vi.spyOn(simulatorService, "deleteAllValidators");
    simServCreateRandomValidators = vi.spyOn(simulatorService, "createRandomValidators");
    simServOpenFrontend = vi.spyOn(simulatorService, "openFrontend");
    simGetSimulatorUrl = vi.spyOn(simulatorService, "getFrontendUrl")
    simAddConfigToEnvFile = vi.spyOn(simulatorService, "addConfigToEnvFile")

    simServCheckVersionRequirements.mockResolvedValue({
      node: '',
      docker: '',
    });
    simServCheckInstallRequirements.mockResolvedValue({
      git: true,
      docker: true,
    })
    simAddConfigToEnvFile.mockResolvedValue(true);
    const mockEnvContent = "FRONTEND_PORT=8080";
    const mockEnvConfig = { FRONTEND_PORT: "8080" };
    vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);
    vi.mocked(dotenv.parse).mockReturnValue(mockEnvConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("if only docker is missing, then the execution fails", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: false });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith("Docker is not installed. Please install Docker and try again.\n");
  });

  test("if check install requirements fail, then the execution aborts", async () => {
    simServCheckInstallRequirements.mockRejectedValue(new Error("Error"));

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("if both versions are too low, then the execution fails", async () => {
    const mockVersionNumber = "99.9.9";
    simServCheckVersionRequirements.mockResolvedValue({
      node: mockVersionNumber,
      docker: mockVersionNumber,
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(
      `Docker version ${mockVersionNumber} or higher is required. Please update Docker and try again.\nNode version ${mockVersionNumber} or higher is required. Please update Node and try again.\n`
    );
  });

  test("if only docker version is too low, then the execution fails", async () => {
    const mockVersionNumber = "99.9.9";
    simServCheckVersionRequirements.mockResolvedValue({
      docker: mockVersionNumber,
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(
      `Docker version ${mockVersionNumber} or higher is required. Please update Docker and try again.\n`
    );
  });

  test("if only node version is too low, then the execution fails", async () => {
    const mockVersionNumber = "99.9.9";
    simServCheckVersionRequirements.mockResolvedValue({
      node: mockVersionNumber
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(
      `Node version ${mockVersionNumber} or higher is required. Please update Node and try again.\n`
    );
  });

  test("if reset is not confirmed, abort", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: false });
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });

    await initAction(defaultActionOptions, simulatorService);

    expect(log).toHaveBeenCalledWith("Aborted!");
  });

  test("if resetDockerContainers fail, then the execution aborts", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: true });
    simServResetDockerContainers.mockRejectedValue(new Error("Error"));

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should open the frontend if everything went well", async () => {
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      { name: "OpenAI", value: "openai" },
      { name: "Heurist", value: "heuristai" },
    ]);

    vi.mocked(OllamaAction.prototype.updateModel).mockResolvedValueOnce(undefined);

    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);
    simGetSimulatorUrl.mockResolvedValue('http://localhost:8080/');
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);

    const frontendUrl = simulatorService.getFrontendUrl();
    expect(log).toHaveBeenCalledWith(
      `GenLayer simulator initialized successfully! Go to ${frontendUrl} in your browser to access it.`
    );
  });

  test("should open the frontend if everything went well (custom options)", async () => {
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      { name: "OpenAI", value: "openai" },
      { name: "Heurist", value: "heuristai" },
    ]);

    vi.mocked(OllamaAction.prototype.updateModel).mockResolvedValueOnce(undefined);

    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);
    simGetSimulatorUrl.mockResolvedValue('http://localhost:8080/');
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction({...defaultActionOptions, headless: true, resetDb: true, localnetVersion: "v1.0.0"}, simulatorService);

    expect(log).toHaveBeenCalledWith(
      `GenLayer simulator initialized successfully! `
    );
  });

  test("should throw an error if validator are not initialized", async () => {
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      { name: "OpenAI", value: "openai" },
      { name: "Heurist", value: "heuristai" },
    ]);

    vi.mocked(OllamaAction.prototype.updateModel).mockResolvedValueOnce(undefined);

    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServCreateRandomValidators.mockRejectedValue();
    simServOpenFrontend.mockResolvedValue(true);
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction({...defaultActionOptions, headless: true}, simulatorService);

    expect(log).toHaveBeenCalledWith('Initializing validators...');
    expect(error).toHaveBeenCalledWith('Unable to initialize the validators.');
  });

  test("if runSimulator fails, then the execution aborts", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: true, confirmDownload: true, selectedLlmProviders: [] });
    simServRunSimulator.mockRejectedValue(new Error("Error"));
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should pull Ollama model if 'ollama' is in providers", async () => {

    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai", "ollama"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
      ollama: "API_KEY3",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      { name: "OpenAI", value: "openai" },
      { name: "Heurist", value: "heuristai" },
      { name: "Ollama", value: "ollama" },
    ]);

    vi.mocked(OllamaAction.prototype.updateModel).mockResolvedValueOnce(undefined);

    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));

    await initAction(defaultActionOptions, simulatorService);

    expect(log).toHaveBeenCalledWith(`Pulling llama3 from Ollama...`);
    expect(OllamaAction.prototype.updateModel).toHaveBeenCalled();
  });

  test("should pull Ollama model if 'ollama' is in providers using defaultOllamaModel", async () => {
    const ollamaModel = "gemma";

    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai", "ollama"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
      ollama: "API_KEY3",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      { name: "OpenAI", value: "openai" },
      { name: "Heurist", value: "heuristai" },
      { name: "Ollama", value: "ollama" },
    ]);

    vi.mocked(OllamaAction.prototype.updateModel).mockResolvedValueOnce(undefined);

    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({defaultOllamaModel: ollamaModel}));

    await initAction(defaultActionOptions, simulatorService);

    expect(log).toHaveBeenCalledWith(`Pulling ${ollamaModel} from Ollama...`);
    expect(OllamaAction.prototype.updateModel).toHaveBeenCalled();
  });

  test("logs error if checkVersionRequirements throws", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    const errorMsg = new Error("checkVersionRequirements error");
    simServCheckVersionRequirements.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("logs error if resetDockerContainers throws", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: true });
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    const errorMsg = new Error("resetDockerContainers error");
    simServResetDockerContainers.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("prompts for LLM providers and validates that at least one is selected", async () => {
    const mockEnvContent = "FRONTEND_PORT=8080";
    vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);

    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockImplementation((questions: any) => {
        if (questions[0].type === "checkbox") {
          const validateFunction = questions[0].validate;
          expect(validateFunction([])).toBe("You must choose at least one option.");
          expect(validateFunction(["openai"])).toBe(true);
          return Promise.resolve({ selectedLlmProviders: ["openai"] });
        }

        if (questions[0].type === "input") {
          const validateFunction = questions[0].validate;
          expect(validateFunction("")).toBe("Please enter a valid API Key for OpenAI.");
          expect(validateFunction("API_KEY1")).toBe(true);
          return Promise.resolve({ openai: "API_KEY1" });
        }
      });

    simServCheckInstallRequirements.mockResolvedValue({ docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);
  });


  test("logs error message if simulator fails to initialize with ERROR code", async () => {
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);

    simServWaitForSimulator.mockResolvedValue({
      initialized: false,
      errorCode: "ERROR",
      errorMessage: "Simulator failed to initialize due to configuration error.",
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(log).toHaveBeenCalledWith("Simulator failed to initialize due to configuration error.");
    expect(error).toHaveBeenCalledWith("Unable to initialize the GenLayer simulator. Please try again.");
  });

  test("logs error if runSimulator throws", async () => {
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai"],
      openai: "API_KEY1",
    });
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    const errorMsg = new Error("runSimulator error");
    simServRunSimulator.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("logs specific message if waitForSimulatorToBeReady returns TIMEOUT errorCode", async () => {
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai"],
      openai: "API_KEY1",
    });
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: false,
      errorCode: "TIMEOUT",
      errorMessage: "errorMessage",
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(
      "The simulator is taking too long to initialize. Please try again after the simulator is ready."
    );
  });

  test("catches and logs error if waitForSimulatorToBeReady throws an exception", async () => {
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);

    const errorMsg = new Error("Unexpected simulator error");
    simServWaitForSimulator.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("catches and logs error if openFrontend throws an exception", async () => {
    const mockEnvContent = "FRONTEND_PORT=8080";
    vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);

    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);

    const errorMsg = new Error("Failed to open frontend");
    simServOpenFrontend.mockImplementationOnce(() => {
      throw errorMsg;
    });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

});