import { describe, beforeEach, afterEach, test, expect, vi, Mock } from "vitest";
import inquirer from "inquirer";
import { startAction, StartActionOptions } from "../../src/commands/general/start";
import { ISimulatorService } from "../../src/lib/interfaces/ISimulatorService";

describe("startAction - Additional Tests", () => {
  let simulatorService: ISimulatorService;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let promptSpy: ReturnType<any>;

  const defaultOptions: StartActionOptions = {
    resetValidators: false,
    numValidators: 5,
    branch: "main",
    location: '',
    headless: false,
    resetDb: false
  };

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    promptSpy = vi.spyOn(inquirer, "prompt");

    simulatorService = {
      updateSimulator: vi.fn().mockResolvedValue(undefined),
      runSimulator: vi.fn().mockResolvedValue(undefined),
      waitForSimulatorToBeReady: vi.fn().mockResolvedValue({ initialized: true }),
      deleteAllValidators: vi.fn().mockResolvedValue(undefined),
      createRandomValidators: vi.fn().mockResolvedValue(undefined),
      openFrontend: vi.fn().mockResolvedValue(undefined),
      setSimulatorLocation: vi.fn().mockResolvedValue(undefined),
      setComposeOptions: vi.fn(),
      getAiProvidersOptions: vi.fn(() => [
        { name: "Provider A", value: "providerA" },
        { name: "Provider B", value: "providerB" },
      ]),
      getFrontendUrl: vi.fn(() => "http://localhost:8080"),
      cleanDatabase: vi.fn().mockResolvedValue(undefined),
    } as unknown as ISimulatorService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("runs successfully with default options and keeps existing validators", async () => {
    await startAction(defaultOptions, simulatorService);

    expect(simulatorService.updateSimulator).toHaveBeenCalledWith("main");
    expect(simulatorService.runSimulator).toHaveBeenCalled();
    expect(simulatorService.waitForSimulatorToBeReady).toHaveBeenCalled();

    expect(logSpy).toHaveBeenCalledWith("Starting GenLayer simulator keeping the existing validators");
    expect(logSpy).toHaveBeenCalledWith("Updating GenLayer Simulator...");
    expect(logSpy).toHaveBeenCalledWith("Running the GenLayer Simulator...");
    expect(logSpy).toHaveBeenCalledWith("Simulator is running!");
    expect(logSpy).toHaveBeenCalledWith("GenLayer simulator initialized successfully! Go to http://localhost:8080 in your browser to access it.");

    expect(simulatorService.openFrontend).toHaveBeenCalled();
  });

  test("runs successfully with custom options and keeps existing validators", async () => {
    await startAction({...defaultOptions, headless: true, resetDb: true}, simulatorService);

    expect(simulatorService.updateSimulator).toHaveBeenCalledWith("main");
    expect(simulatorService.runSimulator).toHaveBeenCalled();
    expect(simulatorService.waitForSimulatorToBeReady).toHaveBeenCalled();

    expect(logSpy).toHaveBeenCalledWith("Starting GenLayer simulator keeping the existing validators");
    expect(logSpy).toHaveBeenCalledWith("Updating GenLayer Simulator...");
    expect(logSpy).toHaveBeenCalledWith("Running the GenLayer Simulator...");
    expect(logSpy).toHaveBeenCalledWith("Simulator is running!");
    expect(logSpy).toHaveBeenCalledWith("GenLayer simulator initialized successfully! ");
  });

  test("logs error and stops if updateSimulator fails", async () => {
    const errorMsg = new Error("updateSimulator error");
    (simulatorService.updateSimulator as Mock).mockRejectedValueOnce(errorMsg);

    await startAction(defaultOptions, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith(errorMsg);
    expect(simulatorService.runSimulator).not.toHaveBeenCalled();
  });

  test("logs error and stops if runSimulator fails", async () => {
    const errorMsg = new Error("runSimulator error");
    (simulatorService.runSimulator as Mock).mockRejectedValueOnce(errorMsg);

    await startAction(defaultOptions, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith(errorMsg);
    expect(simulatorService.waitForSimulatorToBeReady).not.toHaveBeenCalled();
  });

  test("handles resetfValidators correctly by deleting and creating new validators", async () => {
    promptSpy.mockResolvedValueOnce({ selectedLlmProviders: ["providerA"] });
    const optionsWithReset: StartActionOptions = { ...defaultOptions, resetValidators: true };

    await startAction(optionsWithReset, simulatorService);

    expect(simulatorService.deleteAllValidators).toHaveBeenCalled();
    expect(simulatorService.createRandomValidators).toHaveBeenCalledWith(5, ["providerA"]);
    expect(logSpy).toHaveBeenCalledWith("New random validators successfully created...");
  });

  test("logs error if deleteAllValidators fails when resetValidators is true", async () => {
    const errorMsg = new Error("deleteAllValidators error");
    (simulatorService.deleteAllValidators as Mock).mockRejectedValueOnce(errorMsg);
    const optionsWithReset: StartActionOptions = { ...defaultOptions, resetValidators: true };

    await startAction(optionsWithReset, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith("Unable to initialize the validators.");
    expect(errorSpy).toHaveBeenCalledWith(errorMsg);
    expect(simulatorService.createRandomValidators).not.toHaveBeenCalled();
  });

  test("prompts for LLM providers and validates at least one option is selected", async () => {
    const aiProviders = simulatorService.getAiProvidersOptions(false);
    expect(aiProviders).toEqual([
      { name: "Provider A", value: "providerA" },
      { name: "Provider B", value: "providerB" },
    ]);

    promptSpy.mockImplementation(async (questions: any) => {
      const validateFunction = questions[0].validate;

      expect(validateFunction([])).toBe("You must choose at least one option.");
      expect(validateFunction(["providerA"])).toBe(true);

      return { selectedLlmProviders: ["providerA"] };
    });

    const optionsWithReset: StartActionOptions = { ...defaultOptions, resetValidators: true };
    await startAction(optionsWithReset, simulatorService);

    expect(promptSpy).toHaveBeenCalled();
    expect(simulatorService.createRandomValidators).toHaveBeenCalledWith(5, ["providerA"]);
  });

  test("logs specific message if waitForSimulatorToBeReady returns TIMEOUT errorCode", async () => {
    (simulatorService.waitForSimulatorToBeReady as Mock).mockResolvedValue({
      initialized: false,
      errorCode: "TIMEOUT",
      errorMessage: "Initialization timed out",
    });

    await startAction(defaultOptions, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith(
      "The simulator is taking too long to initialize. Please try again after the simulator is ready."
    );
  });

  test("logs error message if simulator fails to initialize with ERROR code", async () => {
    (simulatorService.waitForSimulatorToBeReady as Mock).mockResolvedValue({
      initialized: false,
      errorCode: "ERROR",
      errorMessage: "Initialization failed",
    });

    await startAction(defaultOptions, simulatorService);

    expect(logSpy).toHaveBeenCalledWith("Initialization failed");
    expect(errorSpy).toHaveBeenCalledWith("Unable to initialize the GenLayer simulator. Please try again.");
  });

  test("catches and logs error if waitForSimulatorToBeReady throws an exception", async () => {
    const errorMsg = new Error("Unexpected initialization error");
    (simulatorService.waitForSimulatorToBeReady as Mock).mockRejectedValueOnce(errorMsg);

    await startAction(defaultOptions, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith(errorMsg);
  });

  test("catches and logs error if openFrontend throws an exception", async () => {
    const errorMsg = new Error("Failed to open frontend");
    (simulatorService.openFrontend as Mock).mockImplementationOnce(() => {
      throw errorMsg;
    });

    await startAction(defaultOptions, simulatorService);

    expect(errorSpy).toHaveBeenCalledWith(errorMsg);
  });
});
