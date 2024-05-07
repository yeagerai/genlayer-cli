import {
  updateSimulator,
  runSimulator,
  waitForSimulatorToBeReady,
  deleteAllValidators,
  createRandomValidators,
  clearAccountsAndTransactionsDatabase,
  initializeDatabase,
  getFrontendUrl,
  openFrontend,
} from "@/lib/services/simulator";

export interface StartActionOptions {
  resetAccounts: string;
  resetValidators: string;
}

export async function startAction(options: StartActionOptions) {
  const {resetAccounts, resetValidators} = options;

  const restartAccountsHintText = resetAccounts
    ? "restarting the accounts and transactions database"
    : "keeping the accounts and transactions records";

  const restartValidatorsHintText = resetValidators
    ? "and creating new random validators"
    : "and keeping the existing validators";

  console.log(`Starting GenLayer simulator ${restartAccountsHintText} ${restartValidatorsHintText}`);

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

  if (resetAccounts) {
    // Initialize the database
    console.log("Initializing the database...");
    try {
      //remove everything from the database
      await clearAccountsAndTransactionsDatabase();

      const {createResponse, tablesResponse} = await initializeDatabase();
      if (!createResponse || !tablesResponse) {
        console.error("Unable to initialize the database. Please try again.");
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    }
    console.log("Database successfully reset...");
  }

  if (resetValidators) {
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
    console.log("New random validators successfully created...");
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
