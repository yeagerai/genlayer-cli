/* eslint-disable import/no-named-as-default-member */
import {jest} from "@jest/globals";
import inquirer from "inquirer";

import simulatorService from "../../src/lib/services/simulator";
import {initAction} from "../../src/commands/general/init";

// Default options for the action
const defaultActionOptions = {numValidators: 5};

describe("init action", () => {
  let error: jest.Mock<any>;
  let log: jest.Mock<any>;
  let inquirerPrompt: jest.Mock<any>;

  let simServCheckRequirements: jest.Mock<any>;
  let simServResetDockerContainers: jest.Mock<any>;
  let simServResetDockerImages: jest.Mock<any>;
  let simServDownloadSimulator: jest.Mock<any>;
  let simServUpdateSimulator: jest.Mock<any>;
  let simServgetAiProvidersOptions: jest.Mock<any>;
  let simServConfigSimulator: jest.Mock<any>;
  let simServRunSimulator: jest.Mock<any>;
  let simServWaitForSimulator: jest.Mock<any>;
  let simServPullOllamaModel: jest.Mock<any>;
  let simServClearAccAndTxsDb: jest.Mock<any>;
  let simServInitializeDatabase: jest.Mock<any>;
  let simServDeleteAllValidators: jest.Mock<any>;
  let simServCreateRandomValidators: jest.Mock<any>;
  let simServOpenFrontend: jest.Mock<any>;
  let simServRedEnvConfigVariable: jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    error = jest.spyOn(console, "error").mockImplementation(() => {}) as jest.Mock<any>;
    log = jest.spyOn(console, "log").mockImplementation(() => {}) as jest.Mock<any>;
    inquirerPrompt = jest.spyOn(inquirer, "prompt") as jest.Mock<any>;

    simServCheckRequirements = jest.spyOn(simulatorService, "checkRequirements") as jest.Mock<any>;
    simServResetDockerContainers = jest.spyOn(simulatorService, "resetDockerContainers") as jest.Mock<any>;
    simServResetDockerImages = jest.spyOn(simulatorService, "resetDockerImages") as jest.Mock<any>;
    simServDownloadSimulator = jest.spyOn(simulatorService, "downloadSimulator") as jest.Mock<any>;
    simServUpdateSimulator = jest.spyOn(simulatorService, "updateSimulator") as jest.Mock<any>;
    simServConfigSimulator = jest.spyOn(simulatorService, "configSimulator") as jest.Mock<any>;
    simServgetAiProvidersOptions = jest.spyOn(simulatorService, "getAiProvidersOptions") as jest.Mock<any>;
    simServRunSimulator = jest.spyOn(simulatorService, "runSimulator") as jest.Mock<any>;
    simServWaitForSimulator = jest.spyOn(simulatorService, "waitForSimulatorToBeReady") as jest.Mock<any>;
    simServPullOllamaModel = jest.spyOn(simulatorService, "pullOllamaModel") as jest.Mock<any>;
    simServClearAccAndTxsDb = jest.spyOn(
      simulatorService,
      "clearAccountsAndTransactionsDatabase",
    ) as jest.Mock<any>;
    simServInitializeDatabase = jest.spyOn(simulatorService, "initializeDatabase") as jest.Mock<any>;
    simServDeleteAllValidators = jest.spyOn(simulatorService, "deleteAllValidators") as jest.Mock<any>;
    simServCreateRandomValidators = jest.spyOn(simulatorService, "createRandomValidators") as jest.Mock<any>;
    simServOpenFrontend = jest.spyOn(simulatorService, "openFrontend") as jest.Mock<any>;
    simServRedEnvConfigVariable = jest.spyOn(simulatorService, "readEnvConfigValue") as jest.Mock<any>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("if both requirements are missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: false, docker: false});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      "Git and Docker are not installed. Please install them and try again.\n",
    );
  });

  test("if only docker is missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: true, docker: false});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Docker is not installed. Please install Docker and try again.\n");
  });

  test("if only git is missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: false, docker: true});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Git is not installed. Please install Git and try again.\n");
  });

  test("if check requirements fail, then the execution aborts", async () => {
    // Given
    simServCheckRequirements.mockRejectedValue(new Error("Error"));

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("if reset is not confirmed, abort", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: false});
    simServCheckRequirements.mockResolvedValue({git: true, docker: true});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenNthCalledWith(1, "Aborted!");
  });

  test("if resetDockerContainers fail, then the execution aborts", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true});
    simServResetDockerContainers.mockRejectedValue(new Error("Error"));

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("if resetDockerImages fail, then the execution aborts", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true});
    simServResetDockerImages.mockRejectedValue(new Error("Error"));

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("if download is not confirmed, abort", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true, confirmDownload: false});
    simServCheckRequirements.mockResolvedValue({git: true, docker: true});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(log).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenNthCalledWith(3, "Aborted!");
  });

  test("if not already installed, it should download and install the simulator", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true, confirmDownload: true, selectedLlmProviders: []});
    simServDownloadSimulator.mockResolvedValue({wasInstalled: false});
    simServConfigSimulator.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(simulatorService.downloadSimulator).toHaveBeenCalled();
    expect(simulatorService.updateSimulator).not.toHaveBeenCalled();
  });

  test("if already installed, it should update the simulator", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true, confirmDownload: true, selectedLlmProviders: []});
    simServDownloadSimulator.mockResolvedValue({wasInstalled: true});
    simServUpdateSimulator.mockResolvedValue(true);
    simServConfigSimulator.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(simulatorService.downloadSimulator).toHaveBeenCalled();
    expect(simulatorService.updateSimulator).toHaveBeenCalled();
  });

  test("should prompt for LLM providers and call configSimulator with selected providers", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(inquirerPrompt).toHaveBeenNthCalledWith(3, [
      {
        type: "checkbox",
        name: "selectedLlmProviders",
        message: "Select which LLM providers do you want to use:",
        choices: [
          {name: "OpenAI", value: "openai"},
          {name: "Heurist", value: "heuristai"},
        ],
        validate: expect.any(Function),
      },
    ]);
    expect(simulatorService.configSimulator).toHaveBeenCalledWith({
      OPENAIKEY: "API_KEY1",
      HEURISTAIAPIKEY: "API_KEY2",
    });
  });

  test("if configSimulator fails, then the execution aborts", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true, confirmDownload: true, selectedLlmProviders: []});
    simServConfigSimulator.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("if runSimulator fails, then the execution aborts", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({confirmReset: true, confirmDownload: true, selectedLlmProviders: []});
    simServRunSimulator.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should run the simulator after all configurations", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(simulatorService.runSimulator).toHaveBeenCalled();
  });

  test("should abort if waiting for the simulator returns ERROR", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: false,
      errorCode: "ERROR",
      errorMessage: "errorMessage",
    });

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(log).toHaveBeenCalledWith("errorMessage");
    expect(error).toHaveBeenCalledWith("Unable to initialize the GenLayer simulator. Please try again.");
  });

  test("should abort if waiting for the simulator returns TIMEOUT", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: false,
      errorCode: "TIMEOUT",
      errorMessage: "errorMessage",
    });

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith(
      "The simulator is taking too long to initialize. Please try again after the simulator is ready.",
    );
  });

  test("should abort if waiting for the simulator throws an error", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should pull llama3 from Ollama if ollama is in providers", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai", "ollama"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
      ollama: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
      {name: "Ollama", value: "ollama"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(simServPullOllamaModel).toHaveBeenCalled();
  });

  test("shouldn't pull llama3 from Ollama if ollama is not in providers", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockRejectedValue(new Error("Error")); // This will stop the execution

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(simServPullOllamaModel).not.toHaveBeenCalled();
  });

  test("should abort if clear accounts and transactions throws an error", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should abort if initialize database throws an error", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith(new Error("Error"));
  });

  test("should abort if database create db is not successful", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockResolvedValue({createResponse: false, tablesResponse: true});

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith("Unable to initialize the database. Please try again.");
  });

  test("should abort if database table creation is not successful", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockResolvedValue({createResponse: true, tablesResponse: false});

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith("Unable to initialize the database. Please try again.");
  });

  test("should abort if deleteAllValidators throws an error", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockResolvedValue({createResponse: true, tablesResponse: true});
    simServDeleteAllValidators.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith("Unable to initialize the validators.");
  });

  test("should abort if createRandomValidators throws an error", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockResolvedValue({createResponse: true, tablesResponse: true});
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockRejectedValue(new Error("Error"));

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    expect(error).toHaveBeenCalledWith("Unable to initialize the validators.");
  });

  test("should open the frontend if everything went well", async () => {
    // Given
    inquirerPrompt.mockResolvedValue({
      confirmReset: true,
      confirmDownload: true,
      selectedLlmProviders: ["openai", "heuristai"],
      openai: "API_KEY1",
      heuristai: "API_KEY2",
    });
    simServgetAiProvidersOptions.mockReturnValue([
      {name: "OpenAI", value: "openai"},
      {name: "Heurist", value: "heuristai"},
    ]);
    simServConfigSimulator.mockResolvedValue(true);
    simServRunSimulator.mockResolvedValue(true);
    simServWaitForSimulator.mockResolvedValue({
      initialized: true,
    });
    simServPullOllamaModel.mockResolvedValue(true);
    simServClearAccAndTxsDb.mockResolvedValue(true);
    simServInitializeDatabase.mockResolvedValue({createResponse: true, tablesResponse: true});
    simServDeleteAllValidators.mockResolvedValue(true);
    simServCreateRandomValidators.mockResolvedValue(true);
    simServOpenFrontend.mockResolvedValue(true);
    simServRedEnvConfigVariable.mockReturnValue("8080");

    // When
    await initAction({numValidators: 5}, simulatorService);

    // Then
    const frontendUrl = simulatorService.getFrontendUrl();
    expect(log).toHaveBeenCalledWith(
      `GenLayer simulator initialized successfully! Go to ${frontendUrl} in your browser to access it.`,
    );
  });
});
