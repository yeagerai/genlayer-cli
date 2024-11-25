import inquirer from "inquirer";

import {ISimulatorService} from "../../lib/interfaces/ISimulatorService";
import {PlausibleService} from "../../lib/services/plausible";

export interface StartActionOptions {
  resetValidators: boolean;
  numValidators: number;
  branch: string;
  location: string;
  headless: boolean;
  resetDb: boolean
}
const plausible = new PlausibleService();

export async function startAction(options: StartActionOptions, simulatorService: ISimulatorService) {
  const {resetValidators, numValidators, branch, location, headless, resetDb} = options;
  const config = plausible.loadConfig();

  if (config.telemetryEnabled) {
    await plausible.trackEvent({
      name: "start-action",
      properties: {
        resetValidators,
        numValidators,
        branch,
        location,
        headless,
        resetDb,
      },
    });
  }

  // Update simulator location with user input
  simulatorService.setComposeOptions(headless);
  simulatorService.setSimulatorLocation(location);


  const restartValidatorsHintText = resetValidators
    ? `creating new ${numValidators} random validators`
    : "keeping the existing validators";

  console.log(`Starting GenLayer simulator ${restartValidatorsHintText}`);

  // Update the simulator to the latest version
  console.log(`Updating GenLayer Simulator...`);
  try {
    await simulatorService.updateSimulator(branch);
  } catch (error) {
    console.error(error);
    return;
  }

  // Run the GenLayer Simulator
  console.log("Running the GenLayer Simulator...");
  try {
    await simulatorService.runSimulator();
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    const {initialized, errorCode, errorMessage} = await simulatorService.waitForSimulatorToBeReady();
    if (!initialized && errorCode === "ERROR") {
      console.log(errorMessage);
      console.error("Unable to initialize the GenLayer simulator. Please try again.");
      return;
    }
    if (!initialized && errorCode === "TIMEOUT") {
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

  if(resetDb){
    await simulatorService.cleanDatabase()
  }

  if (resetValidators) {
    // Initializing validators
    console.log("Initializing validators...");
    try {
      //remove all validators
      await simulatorService.deleteAllValidators();
      const questions = [
        {
          type: "checkbox",
          name: "selectedLlmProviders",
          message: "Select which LLM providers do you want to use:",
          choices: simulatorService.getAiProvidersOptions(false),
          validate: function (answer: string[]) {
            if (answer.length < 1) {
              return "You must choose at least one option.";
            }
            return true;
          },
        },
      ];

      // Since ollama runs locally we can run it here and then look for the other providers
      const llmProvidersAnswer = await inquirer.prompt(questions);

      // create random validators
      await simulatorService.createRandomValidators(
        Number(options.numValidators),
        llmProvidersAnswer.selectedLlmProviders,
      );
    } catch (error) {
      console.error("Unable to initialize the validators.");
      console.error(error);
      return;
    }
    console.log("New random validators successfully created...");
  }

  // Simulator ready
  let successMessage = "GenLayer simulator initialized successfully! "
  successMessage += headless ? '' :  `Go to ${simulatorService.getFrontendUrl()} in your browser to access it.`;
  console.log(successMessage);
  try {
    if(!headless) {
      await simulatorService.openFrontend();
    }

  } catch (error) {
    console.error(error);
  }
}
