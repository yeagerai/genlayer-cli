import { Command } from "commander";
import simulatorService from "../../lib/services/simulator";
import { initAction, InitActionOptions } from "./init";
import { startAction, StartActionOptions } from "./start";
import { DeployAction, DeployOptions } from "./deploy";

export function initializeGeneralCommands(program: Command) {
  program
    .command("init")
    .description("Initialize the GenLayer Environment")
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--headless", "Headless mode", false)
    .option("--reset-db", "Reset Database", false)
    .option("--localnet-version <localnetVersion>", "Select a specific localnet version", "latest")
    .action((options: InitActionOptions) => initAction(options, simulatorService));

  program
    .command("up")
    .description("Starts GenLayer's simulator")
    .option("--reset-validators", "Remove all current validators and create new random ones", false)
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--headless", "Headless mode", false)
    .option("--reset-db", "Reset Database", false)
    .action((options: StartActionOptions) => startAction(options, simulatorService));

  program
    .command("deploy")
    .description("Deploy smart contracts or updates to the blockchain")
    .option("--contract <contractPath>", "Path to the smart contract to deploy")
    // .option("--network <networkName>", "Specify the network (e.g., testnet)", "localnet")
    .option("--args <args...>", "Positional arguments for the contract (space-separated)", [])
    .option("--kwargs <kwargs>", "Key-value arguments in KEY=VALUE,KEY=VALUE format", "")
    .action(async (options: DeployOptions) => {
        const deployer = new DeployAction();
        await deployer.deploy(options);
    });

  return program;
}
