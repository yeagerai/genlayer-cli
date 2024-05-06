import {
  updateSimulator,
  runSimulator,
  waitForSimulatorToBeReady,
  deleteAllValidators,
  createRandomValidators,
  clearDatabaseTables,
  initializeDatabase,
  getFrontendUrl,
  openFrontend,
} from "@/lib/services/simulator";

export interface StartActionOptions {
  restart: string;
}

export async function startAction(options: StartActionOptions) {
  const restartHintText = options.restart
    ? "restarting the database and validators"
    : "keeping the database and validators previous configuration";
  console.log(`Starting GenLayer simulator ${restartHintText}`);

  // Update the simulator to the latest version
  console.log(`Updating GenLayer Simulator...`);
  try {
    await updateSimulator();
  } catch (error) {
    console.error(error);
    return;
  }

  // Run the GenLayer Simulator
  console.log("Running the GenLayer Simulator...");
  try {
    runSimulator();
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
        "The simulator is taking too long to initialize. Please try again after the simulator is ready.",
      );
      return;
    }
    console.log("Simulator is running!");
  } catch (error) {
    console.error(error);
    return;
  }

  if (options.restart) {
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
  }

  // Simulator ready
  console.log(
    `GenLayer simulator initialized successfully! Go to ${getFrontendUrl()} in your browser to access it.`,
  );
  try {
    openFrontend();
  } catch (error) {
    console.error(error);
  }
}
