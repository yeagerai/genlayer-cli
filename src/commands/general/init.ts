import inquirer from "inquirer";

import {
  initializeDatabase,
  checkRequirements,
  downloadSimulator,
  runSimulator,
  waitForSimulatorToBeReady,
  updateSimulator,
  clearDatabaseTables,
  createRandomValidators,
  deleteAllValidators,
} from "@/lib/services/simulator";
export interface InitActionOptions {
  numValidators: number;
}

function getRequirementsErrorMessage({git, docker}: Record<string, boolean>): string {
  if (!git && !docker) {
    return "Git and Docker are not installed. Please install them and try again.\n";
  }
  if (!git) {
    return "Git is not installed. Please install Git and try again.\n";
  }
  if (!docker) {
    return "Docker is not installed. Please install Docker and try again.\n";
  }
  return "";
}

export async function initAction(options: InitActionOptions) {
  console.log(`Initializing GenLayer CLI with ${options.numValidators} validators`);

  // Check if git and docker are installed
  try {
    const {git, docker} = await checkRequirements();
    const errorMessage = getRequirementsErrorMessage({git, docker});
    if (errorMessage) {
      console.error(errorMessage);
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // Ask for confirmation on downloading the GenLayer Simulator from GitHub
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDownload",
      message: `This action is going to download the GenLayer Simulator from GitHub. Do you want to continue?`,
      default: true,
    },
  ]);

  if (!answers.confirmDownload) {
    console.log("Aborted!");
    return;
  }

  // Download the GenLayer Simulator from GitHub
  console.log(`Downloading GenLayer Simulator from GitHub...`);
  try {
    const {wasInstalled} = await downloadSimulator();
    if (wasInstalled) {
      await updateSimulator();
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // Run the GenLayer Simulator
  console.log("Running the GenLayer Simulator...");
  try {
    await runSimulator();
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    const {initialized, error} = await waitForSimulatorToBeReady();
    if (!initialized && error === "ERROR") {
      console.error("Unable to initialize the GenLayer simulator. Please try again.");
      return;
    }
    if (!initialized && error === "TIMEOUT") {
      console.error(
        "The simulator is taking too lonk to initialize. Please try again after the simulator is ready.",
      );
      return;
    }
    console.log("Simulator is running!");
  } catch (error) {
    console.error(error);
    return;
  }

  // Initialize the database
  console.log("Initializing the database...");
  try {
    //remove everything from the database
    await clearDatabaseTables();

    const {createResponse, tablesResponse} = await initializeDatabase();
    if (!createResponse || !tablesResponse) {
      console.error("Unable to initialize the database. Please try again.");
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // Initializing validators
  console.log("Initializing validators...");
  try {
    //remove all validators
    await deleteAllValidators();
    // create random validators
    await createRandomValidators();
  } catch (error) {
    console.error("Unable to initialize the validators.");
    console.error(error);
    return;
  }

  console.log("GenLayer simulator initialized successfully!");
}
