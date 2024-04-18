import {Command, program} from "commander";

export function getCommand(commandName: string): Command | undefined {
  return program.commands.find(command => command.name() === commandName);
}
