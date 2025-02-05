import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { StopAction } from "../../src/commands/general/stop";
import { SimulatorService } from "../../src/lib/services/simulator";
import { ISimulatorService } from "../../src/lib/interfaces/ISimulatorService";
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
        message: "Are you sure you want to stop all running GenLayer containers? This will halt all active processes.",
        default: true,
      },
    ]);
    expect(mockSimulatorService.stopDockerContainers).toHaveBeenCalled();
  });

  test("should abort if user cancels", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: false });

    console.log = vi.fn();

    await stopAction.stop();

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("Operation aborted!");
    expect(mockSimulatorService.stopDockerContainers).not.toHaveBeenCalled();
  });
});
