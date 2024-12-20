import { Command } from "commander";
import { DeployAction, DeployOptions } from "../contracts/deploy";

export function initializeContractsCommands(program: Command) {

  program
    .command("deploy")
    .description("Deploy intelligent contracts")
    .option("--contract <contractPath>", "Path to the smart contract to deploy")
    // .option("--network <networkName>", "Specify the network (e.g., testnet)", "localnet")
    .option("--args <args...>", "Positional arguments for the contract (space-separated, use quotes for multi-word arguments)", [])
    .action(async (options: DeployOptions) => {
      const deployer = new DeployAction();
      await deployer.deploy(options);
    });

  return program;
}
