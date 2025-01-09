import inquirer from "inquirer";

export class BaseAction {
  protected async confirmPrompt(message: string): Promise<void> {
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmAction",
        message: message,
        default: true,
      },
    ]);

    if (!answer.confirmAction) {
      console.log("Operation aborted!");
      process.exit(0);
    }
  }
}
