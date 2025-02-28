import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { StopAction } from "../../src/commands/general/stop";
import { SimulatorService } from "../../src/lib/services/simulator";
import { ISimulatorService } from "../../src/lib/interfaces/ISimulatorService";
import chalk from "chalk";

import inquirer from "inquirer";

vi.mock("../../src/lib/services/simulator");
vi.mock("inquirer");

describe("StopAction", () => {
  let stopAction: StopAction;
  let mockSimulatorService: ISimulatorService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSimulatorService = {
      stopDockerContainers: vi.fn(),
    } as unknown as ISimulatorService;

    SimulatorService.prototype.stopDockerContainers = mockSimulatorService.stopDockerContainers;

    stopAction = new StopAction();
    (stopAction as any).simulatorService = mockSimulatorService;

    vi.spyOn(stopAction as any, "startSpinner").mockImplementation(() => {});
    vi.spyOn(stopAction as any, "succeedSpinner").mockImplementation(() => {});
    vi.spyOn(stopAction as any, "failSpinner").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should stop containers if user confirms", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: true });

    await stopAction.stop();

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "confirm",
        name: "confirmAction",
        message: chalk.yellow("Are you sure you want to stop all running GenLayer containers? This will halt all active processes."),
        default: true,
      },
    ]);
    expect(mockSimulatorService.stopDockerContainers).toHaveBeenCalled();
    expect(stopAction["succeedSpinner"]).toHaveBeenCalledWith(
      "All running GenLayer containers have been successfully stopped."
    );
  });

  test("should abort if user cancels", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: false });

    await stopAction.stop();

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(mockSimulatorService.stopDockerContainers).not.toHaveBeenCalled();
  });

  test("should handle errors and call failSpinner", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: true });
    const error = new Error("Test Error");
    mockSimulatorService.stopDockerContainers = vi.fn().mockRejectedValue(error);

    await stopAction.stop();

    expect(stopAction["failSpinner"]).toHaveBeenCalledWith(
      "An error occurred while stopping the containers.",
      error
    );
  });
});
