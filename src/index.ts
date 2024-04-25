#!/usr/bin/env node
import {program} from "commander";
import {version} from "../package.json";
import {CLI_DESCRIPTION} from "@/lib/config/text";
import {initializeGeneralCommands} from "@/commands/general";

program.version(version).description(CLI_DESCRIPTION);

initializeGeneralCommands(program);

program.parse(process.argv);
