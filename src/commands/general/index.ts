import {Command} from "commander";

import {initAction} from "./init";

export function initializeGeneralCommands(program: Command) {
  program
    .command("init")
    .description("Initialize the GenLayer Environment")
    .option("-n, --numValidators <numValidators>", "Number of validators", "5")
    .action(initAction);
  return program;
}
