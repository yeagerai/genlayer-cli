import Docker from "dockerode"

export class OllamaAction {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async updateModel(modelName: string) {
    await this.executeModelCommand("pull", modelName, `Model "${modelName}" updated successfully`);
  }

  async removeModel(modelName: string) {
    await this.executeModelCommand("rm", modelName, `Model "${modelName}" removed successfully`);
  }

  private async executeModelCommand(command: string, modelName: string, successMessage: string) {
    try {
      const ollamaContainer = this.docker.getContainer("ollama");
      const exec = await ollamaContainer.exec({
        Cmd: ["ollama", command, modelName],
        AttachStdout: true,
        AttachStderr: true,
      });
      const stream = await exec.start({ Detach: false, Tty: false });

      stream.on("data", (chunk: any) => {
        console.log(chunk.toString());
      });

      await new Promise<void>((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      console.log(successMessage);
    } catch (error) {
      console.error(`Error executing command "${command}" on model "${modelName}":`, error);
    }
  }
}
