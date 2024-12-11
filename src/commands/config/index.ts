import { Command } from "commander";
import { ConfigActions } from "./getSetReset";

export function initializeConfigCommands(program: Command) {
  const configActions = new ConfigActions();

  const configCommand = program
    .command("config")
    .description("Manage CLI configuration, including the default network");

  configCommand
    .command("set")
    .description("Set a configuration value")
    .argument("<key=value>", "Configuration key-value pair to set")
    .action((keyValue: string) => configActions.set(keyValue));

  configCommand
    .command("get")
    .description("Get the current configuration")
    .argument("[key]", "Configuration key to retrieve")
    .action((key?: string) => configActions.get(key));

  configCommand
    .command("reset")
    .description("Reset a configuration value to its default")
    .argument("<key>", "Configuration key to reset")
    .action((key: string) => configActions.reset(key));

  return program;
}
