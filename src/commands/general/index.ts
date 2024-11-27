import {Command} from "commander";

import simulatorService from "../../lib/services/simulator";

import {initAction, InitActionOptions} from "./init";
import {startAction, StartActionOptions} from "./start";

export function initializeGeneralCommands(program: Command) {
  program
    .command("init")
    .description("Initialize the GenLayer Environment")
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--headless", "Headless mode", false)
    .option("--reset-db", "Reset Database", false)
    .action((options: InitActionOptions) => initAction(options, simulatorService));

  program
    .command("up")
    .description("Starts GenLayer's simulator")
    .option("--reset-validators", "Remove all current validators and create new random ones", false)
    .option("--numValidators <numValidators>", "Number of validators", "5")
    .option("--branch <branch>", "Branch", "main")
    .option("--location <folder>", "Location where it will be installed", process.cwd())
    .option("--headless", "Headless mode", false)
    .option("--reset-db", "Reset Database", false)
    .action((options: StartActionOptions) => startAction(options, simulatorService));

  return program;
}
