import { Command } from "commander";
import { OllamaAction } from "./ollama";
import { ConfigFileManager } from "../../lib/config/ConfigFileManager";

export function initializeUpdateCommands(program: Command) {
  const updateCommand = program
    .command("update")
    .description("Update resources like models or configurations");

  updateCommand
    .command("ollama")
    .description("Manage Ollama models (update or remove)")
    .option("--model [model-name]", "Specify the model to update or remove")
    .option("--remove", "Remove the specified model instead of updating")
    .action(async (options) => {
      const configManager = new ConfigFileManager();
      const config = configManager.getConfig()

      const modelName = options.model || config.defaultOllamaModel;
      const ollamaAction = new OllamaAction();

      if (options.remove) {
        await ollamaAction.removeModel(modelName);
      } else {
        await ollamaAction.updateModel(modelName);
      }
    });

  return program;
}
