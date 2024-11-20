#!/usr/bin/env node
import {program} from "commander";
import {version} from "../package.json";
import {CLI_DESCRIPTION} from "../src/lib/config/text";
import {initializeGeneralCommands} from "../src/commands/general";

export function initializeCLI() {
  program.version(version).description(CLI_DESCRIPTION);
  initializeGeneralCommands(program);
  program.parse(process.argv);
}

initializeCLI();
