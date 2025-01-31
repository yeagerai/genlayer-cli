import Docker from "dockerode";
import { rpcClient } from "../../lib/clients/jsonRpcClient";

export class OllamaAction {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async updateModel(modelName: string) {
    const providersAndModels = await rpcClient.request({
      method: "sim_getProvidersAndModels",
      params: [],
    });

    const existingOllamaProvider = providersAndModels.result.find(
      (entry: any) => entry.plugin === "ollama"
    );

    if (!existingOllamaProvider) {
      throw new Error("No existing 'ollama' provider found. Unable to add/update a model.");
    }

    await this.executeModelCommand(
      "pull",
      modelName,
      `Model "${modelName}" updated successfully`
    );

    const existingModel = providersAndModels.result.some(
      (entry: any) =>
        entry.plugin === "ollama" && entry.model === modelName
    );

    if (!existingModel) {
      console.log(`Model "${modelName}" not found in Provider Presets. Adding...`);

      const newModelConfig = {
        config: existingOllamaProvider.config,
        model: modelName,
        plugin: "ollama",
        plugin_config: existingOllamaProvider.plugin_config,
        provider: "ollama",
      };

      await rpcClient.request({
        method: "sim_addProvider",
        params: [newModelConfig],
      });

      console.log(`Model "${modelName}" added successfully.`);
    }
  }

  async removeModel(modelName: string) {
    await this.executeModelCommand(
      "rm",
      modelName,
      `Model "${modelName}" removed successfully`
    );
  }

  private async executeModelCommand(
    command: string,
    modelName: string,
    successMessage: string
  ) {
    try {
      let success = false;
      const ollamaContainer = this.docker.getContainer("ollama");
      const exec = await ollamaContainer.exec({
        Cmd: ["ollama", command, modelName],
        AttachStdout: true,
        AttachStderr: true,
      });
      const stream = await exec.start({Detach: false, Tty: false});

      stream.on("data", (chunk: any) => {
        const chunkStr = chunk.toString();
        console.log(chunkStr);
        if (chunkStr.includes("success") || chunkStr.includes("deleted")) {
          success = true;
        }
      });

      await new Promise<void>((resolve, reject) => {
        stream.on("end", () => {
          if (success) {
            resolve();
          } else {
            reject('internal error');
          }
        });
        stream.on("error", reject);
      });

      console.log(successMessage);
    }catch (error) {
      console.error(`Error executing command "${command}" on model "${modelName}":`, error);
    }
  }
}
