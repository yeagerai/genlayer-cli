import { BaseAction } from "../../lib/actions/BaseAction";
import { SimulatorService } from "../../lib/services/simulator";
import { ISimulatorService } from "../../lib/interfaces/ISimulatorService";

export class StopAction extends BaseAction {
  private simulatorService: ISimulatorService;

  constructor() {
    super();
    this.simulatorService = new SimulatorService(); // Correctly instantiate the service
  }

  public async stop(): Promise<void> {
    try{
      await this.confirmPrompt(
        "Are you sure you want to stop all running GenLayer containers? This will halt all active processes."
      );
      await this.simulatorService.stopDockerContainers();
    }catch (error) {
      console.error("An error occurred while stopping the containers:", error)
    }
  }
}
