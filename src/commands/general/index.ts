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
    .option("-nr, --no-restart", "Don't restart the database and validators", true)
    .action(startAction);

  return program;
}
