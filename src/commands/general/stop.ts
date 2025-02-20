import { BaseAction } from "../../lib/actions/BaseAction";
import { SimulatorService } from "../../lib/services/simulator";
import { ISimulatorService } from "../../lib/interfaces/ISimulatorService";

export class StopAction extends BaseAction {
  private simulatorService: ISimulatorService;

  constructor() {
    super();
    this.simulatorService = new SimulatorService();
  }

  public async stop(): Promise<void> {
    try {
      await this.confirmPrompt(
        "Are you sure you want to stop all running GenLayer containers? This will halt all active processes."
      );

      this.startSpinner("Stopping Docker containers...");
      await this.simulatorService.stopDockerContainers();
      this.succeedSpinner("All running GenLayer containers have been successfully stopped.");
    } catch (error) {
      this.failSpinner("An error occurred while stopping the containers.", error);
    }
  }
}
