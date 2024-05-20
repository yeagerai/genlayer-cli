import inquirer from "inquirer";

import {AI_PROVIDERS_CONFIG, AiProviders} from "@/lib/config/simulator";
import {
  initializeDatabase,
  checkRequirements,
  downloadSimulator,
  configSimulator,
  runSimulator,
  waitForSimulatorToBeReady,
  updateSimulator,
  clearAccountsAndTransactionsDatabase,
  createRandomValidators,
  deleteAllValidators,
  pullOllamaModel,
  getAiProvidersOptions,
  getSimulatorLocation,
  getFrontendUrl,
  openFrontend,
  resetDockerContainers,
  resetDockerImages,
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

  // Reset Docker containers and images
  console.log(`Resetting Docker containers and images...`);
  try {
    await resetDockerContainers();
    await resetDockerImages();
  } catch (error) {
    console.error(error);
    return;
  }

  // Ask for confirmation on downloading the GenLayer Simulator from GitHub
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDownload",
      message: `This action is going to download the GenLayer Simulator from GitHub into "${getSimulatorLocation()}". Do you want to continue?`,
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

  // Check LLM configuration
  const questions = [
    {
      type: "checkbox",
      name: "selectedLlmProviders",
      message: "Select which LLM providers do you want to use:",
      choices: getAiProvidersOptions(true),
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
  const selectedLlmProviders = llmProvidersAnswer.selectedLlmProviders as AiProviders[];

  // Gather the API Keys
  const aiProvidersEnvVars: Record<string, string> = {};
  const configurableAiProviders = selectedLlmProviders.filter(
    (provider: AiProviders) => AI_PROVIDERS_CONFIG[provider].envVar,
  );
  for (let i = 0; i < configurableAiProviders.length; i++) {
    const provider = configurableAiProviders[i];
    const providerConfig = AI_PROVIDERS_CONFIG[provider];
    const questions = [
      {
        type: "input",
        name: providerConfig.cliOptionValue,
        message: `Please enter your ${providerConfig.name} API Key:`,
        validate: function (value: string) {
          if (value.length) {
            return true;
          }
          return `Please enter a valid API Key for ${providerConfig.name}.`;
        },
      },
    ];

    const apiKeyAnswer = await inquirer.prompt(questions);
    aiProvidersEnvVars[providerConfig.envVar!] = apiKeyAnswer[providerConfig.cliOptionValue];
  }

  console.log("Configuring GenLayer Simulator environment...");
  try {
    await configSimulator(aiProvidersEnvVars);
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
    const {initialized, errorCode, errorMessage} = await waitForSimulatorToBeReady();
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

  // Ollama doesn't need changes in configuration, we just run it
  if (selectedLlmProviders.includes("ollama")) {
    console.log("Pulling llama3 from Ollama...");
    await pullOllamaModel();
  }

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

  // Initializing validators
  console.log("Initializing validators...");
  try {
    //remove all validators
    await deleteAllValidators();
    // create random validators
    await createRandomValidators(Number(options.numValidators), selectedLlmProviders);
  } catch (error) {
    console.error("Unable to initialize the validators.");
    console.error(error);
    return;
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
