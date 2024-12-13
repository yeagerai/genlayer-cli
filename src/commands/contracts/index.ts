import { Command } from "commander";
import { DeployAction, DeployOptions } from "./deploy";
import { CallAction, CallOptions } from "./call";

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

  program
    .command("call <contractAddress> <method>")
    .description("Call a contract method")
    .option("--args <args...>", "Positional arguments for the method (space-separated, use quotes for multi-word arguments)", [])
    .option("--type <type>", "Type of call: read or write (default is read)", "read")
    .action(async (contractAddress: string, method: string, options: CallOptions) => {
      const caller = new CallAction();
      await caller.call({ contractAddress, method, ...options });
    });

  return program;
}
