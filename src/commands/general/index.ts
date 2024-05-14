import {Command} from "commander";

import {initAction} from "./init";
import {startAction} from "./start";

export function initializeGeneralCommands(program: Command) {
  program
    .command("init")
    .description("Initialize the GenLayer Environment")
    .option("-n, --numValidators <numValidators>", "Number of validators", "5")
    .action(initAction);

  program
    .command("up")
    .description("Starts GenLayer's simulator")
    .option("--no-reset-accounts", "Don't restart the database for accouts and transactions", true)
    .option("--reset-validators", "Remove all current validators and create new random ones", false)
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .action(startAction);

  return program;
}
