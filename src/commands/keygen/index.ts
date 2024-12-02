import { Command } from "commander";
import { KeypairCreator } from "./create";

export function initializeKeygenCommands(program: Command) {

  const keygenCommand = program
    .command("keygen")
    .description("Manage keypair generation");

  keygenCommand
    .command("create")
    .description("Generates a new keypair and saves it to a file")
    .option("--output <path>", "Path to save the keypair", "./keypair.json")
    .action((options: { output: string }) => {
      const keypairCreator = new KeypairCreator();
      keypairCreator.createKeypairAction({ output: options.output });
    });

  return program;
}
