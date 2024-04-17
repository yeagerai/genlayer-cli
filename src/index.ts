import {program} from "commander";
import {exampleCommand} from "./commands/exampleCommand";

program.version("0.1.0").description("An example CLI tool");

program.command("example").description("Run the example command").action(exampleCommand);
console.log("program", program);
program.parse(process.argv);
