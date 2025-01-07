#!/usr/bin/env node
import {program} from "commander";
import {version} from "../package.json";
import {CLI_DESCRIPTION} from "../src/lib/config/text";
import { initializeGeneralCommands } from "../src/commands/general";
import { initializeKeygenCommands } from "../src/commands/keygen";
import { initializeContractsCommands } from "../src/commands/contracts";
import { initializeConfigCommands } from "../src/commands/config";
import { initializeUpdateCommands } from "../src/commands/update";

export function initializeCLI() {
  program.version(version).description(CLI_DESCRIPTION);
  initializeGeneralCommands(program);
  initializeKeygenCommands(program);
  initializeContractsCommands(program);
  initializeConfigCommands(program);
  initializeUpdateCommands(program)
  program.parse(process.argv);
}

initializeCLI();
