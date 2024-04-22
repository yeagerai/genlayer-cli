#!/usr/bin/env node
import {program} from "commander";

import {CLI_DESCRIPTION} from "@/lib/config/text";
import {initializeGeneralCommands} from "@/commands/general";

program.version("0.0.1").description(CLI_DESCRIPTION);

initializeGeneralCommands(program);

program.parse(process.argv);
