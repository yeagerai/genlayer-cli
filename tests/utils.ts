import {Command, Option, program} from "commander";

export function getCommand(commandName: string): Command {
  const command = program.commands.find(command => command.name() === commandName);
  if (!command) {
    throw new Error(`Command ${commandName} not found`);
  }
  return command;
}

export function getCommandOption(command: Command, optionName: string): Option | undefined {
  return command.options.find(option => option.long === optionName);
}
