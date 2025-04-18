import { Command } from "commander";
import { DeployAction, DeployOptions } from "./deploy";
import { CallAction, CallOptions } from "./call";

function parseArg(value: string, previous: any[] = []): any[] {
  if (value === "true") return [...previous, true];
  if (value === "false") return [...previous, false];
  if (!isNaN(Number(value))) return [...previous, Number(value)];
  return [...previous, value];
}

export function initializeContractsCommands(program: Command) {

  program
    .command("deploy")
    .description("Deploy intelligent contracts")
    .option("--contract <contractPath>", "Path to the smart contract to deploy")
    // .option("--network <networkName>", "Specify the network (e.g., testnet)", "localnet")
    .option("--args <args...>", "Positional arguments for the contract (space-separated, use quotes for multi-word arguments)", parseArg, [])
    .action(async (options: DeployOptions) => {
      const deployer = new DeployAction();
      if(options.contract){
        await deployer.deploy(options);
      }else {
        await deployer.deployScripts();
      }
    });

  program
    .command("call <contractAddress> <method>")
    .description("Call a contract method")
    .option("--args <args...>", "Positional arguments for the method (space-separated, use quotes for multi-word arguments)", parseArg, [])
    .action(async (contractAddress: string, method: string, options: CallOptions) => {
      const caller = new CallAction();
      await caller.call({ contractAddress, method, ...options });
    });

  return program;
}
