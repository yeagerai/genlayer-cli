import {vi, describe, beforeEach, afterEach, test, expect, Mock} from "vitest";
import inquirer from "inquirer";
import simulatorService from "../../src/lib/services/simulator";
import { initAction } from "../../src/commands/general/init";
import { tmpdir } from "os";
import {mkdtempSync} from "fs";
import {join} from "path";
import Docker from "dockerode";


vi.mock("dockerode");

const tempDir = mkdtempSync(join(tmpdir(), "test-initAction-"));
const defaultActionOptions = { numValidators: 5, branch: "main", location: tempDir, headless: false };

describe("init action", () => {
  let error: ReturnType<any>;
  let log: ReturnType<any>;
  let inquirerPrompt: ReturnType<any>;

  let simServCheckInstallRequirements: ReturnType<any>;
  let simServCheckVersionRequirements: ReturnType<any>;
  let simServResetDockerContainers: ReturnType<any>;
  let simServResetDockerImages: ReturnType<any>;
  let simServDownloadSimulator: ReturnType<any>;
  let simServgetAiProvidersOptions: ReturnType<any>;
  let simServConfigSimulator: ReturnType<any>;
  let simServRunSimulator: ReturnType<any>;
  let simServWaitForSimulator: ReturnType<any>;
  let simServPullOllamaModel: ReturnType<any>;
  let simServDeleteAllValidators: ReturnType<any>;
  let simServCreateRandomValidators: ReturnType<any>;
  let simServOpenFrontend: ReturnType<any>;
  let simGetSimulatorUrl: ReturnType<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(Docker.prototype.ping).mockResolvedValueOnce({});

    error = vi.spyOn(console, "error").mockImplementation(() => {});
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    inquirerPrompt = vi.spyOn(inquirer, "prompt");

    simServCheckInstallRequirements = vi.spyOn(simulatorService, "checkInstallRequirements");
    simServCheckVersionRequirements = vi.spyOn(simulatorService, "checkVersionRequirements");
    simServResetDockerContainers = vi.spyOn(simulatorService, "resetDockerContainers");
    simServResetDockerImages = vi.spyOn(simulatorService, "resetDockerImages");
    simServDownloadSimulator = vi.spyOn(simulatorService, "downloadSimulator");
    simServConfigSimulator = vi.spyOn(simulatorService, "configSimulator");
    simServgetAiProvidersOptions = vi.spyOn(simulatorService, "getAiProvidersOptions");
    simServRunSimulator = vi.spyOn(simulatorService, "runSimulator");
    simServWaitForSimulator = vi.spyOn(simulatorService, "waitForSimulatorToBeReady");
    simServPullOllamaModel = vi.spyOn(simulatorService, "pullOllamaModel");
    simServDeleteAllValidators = vi.spyOn(simulatorService, "deleteAllValidators");
    simServCreateRandomValidators = vi.spyOn(simulatorService, "createRandomValidators");
    simServOpenFrontend = vi.spyOn(simulatorService, "openFrontend");
    simGetSimulatorUrl = vi.spyOn(simulatorService, "getFrontendUrl")

    simServCheckVersionRequirements.mockResolvedValue({
      node: '',
      docker: '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("if both requirements are missing, then the execution fails", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: false, docker: false });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(
      "Git and Docker are not installed. Please install them and try again.\n"
    );
  });

  test("if only docker is missing, then the execution fails", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: false });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith("Docker is not installed. Please install Docker and try again.\n");
  });

  test("if only git is missing, then the execution fails", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: false, docker: true });

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith("Git is not installed. Please install Git and try again.\n");
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
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServPullOllamaModel.mockResolvedValue(true);
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

  test("should open the frontend if everything went well (headless mode)", async () => {
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
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServPullOllamaModel.mockResolvedValue(true);
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);
    simGetSimulatorUrl.mockResolvedValue('http://localhost:8080/');
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction({...defaultActionOptions, headless: true}, simulatorService);

    expect(log).toHaveBeenCalledWith(
      `GenLayer simulator initialized successfully! `
    );
  });


  test("if configSimulator fails, then the execution aborts", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: true, confirmDownload: true, selectedLlmProviders: [] });
    simServConfigSimulator.mockRejectedValue(new Error("Error"));
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(new Error("Error"));
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
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServPullOllamaModel.mockResolvedValue(true);
    simServDeleteAllValidators.mockResolvedValue(true);
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);

    expect(simServPullOllamaModel).toHaveBeenCalled();
  });

  test("logs error if checkVersionRequirements throws", async () => {
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    const errorMsg = new Error("checkVersionRequirements error");
    simServCheckVersionRequirements.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("logs 'Aborted!' if confirmDownload is false", async () => {
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ confirmDownload: false });

    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);

    expect(log).toHaveBeenCalledWith("Aborted!");
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
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ confirmDownload: true })
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

    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({ initialized: true });
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);

    await initAction(defaultActionOptions, simulatorService);
  });

  test("logs error if downloadSimulator throws", async () => {
    inquirerPrompt.mockResolvedValue({ confirmReset: true, confirmDownload: true });
    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    const errorMsg = new Error("downloadSimulator error");
    simServDownloadSimulator.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("logs error message if simulator fails to initialize with ERROR code", async () => {
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ confirmDownload: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
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
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
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
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
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
      .mockResolvedValueOnce({ confirmDownload: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);

    const errorMsg = new Error("Unexpected simulator error");
    simServWaitForSimulator.mockRejectedValueOnce(errorMsg);

    await initAction(defaultActionOptions, simulatorService);

    expect(error).toHaveBeenCalledWith(errorMsg);
  });

  test("catches and logs error if openFrontend throws an exception", async () => {
    inquirerPrompt
      .mockResolvedValueOnce({ confirmReset: true })
      .mockResolvedValueOnce({ confirmDownload: true })
      .mockResolvedValueOnce({ selectedLlmProviders: ["openai"] })
      .mockResolvedValueOnce({ openai: "API_KEY1" });

    simServCheckInstallRequirements.mockResolvedValue({ git: true, docker: true });
    simServResetDockerContainers.mockResolvedValue(true);
    simServResetDockerImages.mockResolvedValue(true);
    simServDownloadSimulator.mockResolvedValue({ wasInstalled: false });
    simServConfigSimulator.mockResolvedValue(true);
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