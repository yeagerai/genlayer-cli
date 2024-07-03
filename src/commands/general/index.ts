import {Command} from "commander";

import simulatorService from "../../lib/services/simulator";

import {initAction, InitActionOptions} from "./init";
import {startAction, StartActionOptions} from "./start";

export function initializeGeneralCommands(program: Command) {
  program
    .command("init")
    .description("Initialize the GenLayer Environment")
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--branch <branch>", "Branch", "main")
    .action((options: InitActionOptions) => initAction(options, simulatorService));

  program
    .command("up")
    .description("Starts GenLayer's simulator")
    .option("--no-reset-accounts", "Don't restart the database for accouts and transactions", true)
    .option("--reset-validators", "Remove all current validators and create new random ones", false)
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--branch <branch>", "Branch", "main")
    .action((options: StartActionOptions) => startAction(options, simulatorService));

  return program;
}
