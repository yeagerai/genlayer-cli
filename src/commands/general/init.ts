import inquirer from "inquirer";

export interface InitActionOptions {
  numValidators: number;
}

export async function initAction(options: InitActionOptions) {
  console.log("Initializing GenLayer CLI...");
  console.log("Number of validators:", options.numValidators);

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDelete",
      message: `This action is going to download the GenLayer Simulator from GitHub. Do you want to continue?`,
      default: false,
    },
  ]);

  if (!answers.confirmDelete) {
    console.log("Aborted!");
    return;
  }
}
