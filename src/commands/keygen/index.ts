import { Command } from "commander";
import { CreateKeypairOptions, KeypairCreator } from "./create";

export function initializeKeygenCommands(program: Command) {

  const keygenCommand = program
    .command("keygen")
    .description("Manage keypair generation");

  keygenCommand
    .command("create")
    .description("Generates a new keypair and saves it to a file")
    .option("--output <path>", "Path to save the keypair", "./keypair.json")
    .option("--overwrite", "Overwrite the existing file if it already exists", false)
    .action((options: CreateKeypairOptions) => {
      const keypairCreator = new KeypairCreator();
      keypairCreator.createKeypairAction(options);
    });

  return program;
}
