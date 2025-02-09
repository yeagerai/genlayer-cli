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
    try{
      await this.confirmPrompt(
        "Are you sure you want to stop all running GenLayer containers? This will halt all active processes."
      );
      console.log(`Stopping Docker containers...`);
      await this.simulatorService.stopDockerContainers();
      console.log(`All running GenLayer containers have been successfully stopped.`);
    }catch (error) {
      console.error("An error occurred while stopping the containers:", error)
    }
  }
}
