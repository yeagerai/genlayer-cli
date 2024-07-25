import inquirer from "inquirer";

import {ISimulatorService} from "../../lib/interfaces/ISimulatorService";
import {AI_PROVIDERS_CONFIG, AiProviders} from "../../lib/config/simulator";
export interface InitActionOptions {
  numValidators: number;
  branch: string;
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

function getVersionErrorMessage({docker, node}: Record<string, string>): string {
  let message = "";

  if (docker) {
    message += `Docker version ${docker} or higher is required. Please update Docker and try again.\n`;
  }

  if (node) {
    message += `Node version ${node} or higher is required. Please update Node and try again.\n`;
  }

  return message;
}

export async function initAction(options: InitActionOptions, simulatorService: ISimulatorService) {
  // Check if requirements are installed and if the versions are correct
  try {
    const requirementsInstalled = await simulatorService.checkInstallRequirements();
    const requirementErrorMessage = getRequirementsErrorMessage(requirementsInstalled);

    const missingVersions = await simulatorService.checkVersionRequirements();
    const versionErrorMessage = getVersionErrorMessage(missingVersions);

    if (requirementErrorMessage || versionErrorMessage) {
      console.log(
        "There was a problem running the docker service. Please start the docker service and try again.",
      );
      console.error(requirementErrorMessage || versionErrorMessage);
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // Ask for confirmation on reseting the GenLayer Simulator from GitHub
  const resetAnswers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmReset",
      message: `This command is going to reset GenLayer docker images and containers, providers API Keys, and GenLayer database (accounts, transactions, and validators). Do you want to continue?`,
      default: true,
    },
  ]);

  if (!resetAnswers.confirmReset) {
    console.log("Aborted!");
    return;
  }

  console.log(`Initializing GenLayer CLI with ${options.numValidators} validators`);

  // Reset Docker containers and images
  console.log(`Resetting Docker containers and images...`);
  try {
    await simulatorService.resetDockerContainers();
    await simulatorService.resetDockerImages();
  } catch (error) {
    console.error(error);
    return;
  }

  // Ask for confirmation on downloading the GenLayer Simulator from GitHub
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDownload",
      message: `This action is going to download the GenLayer Simulator from GitHub (branch ${options.branch}) into "${simulatorService.getSimulatorLocation()}". Do you want to continue?`,
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
    const {wasInstalled} = await simulatorService.downloadSimulator(options.branch);
    if (wasInstalled) {
      await simulatorService.updateSimulator(options.branch);
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
      choices: simulatorService.getAiProvidersOptions(true),
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
    await simulatorService.configSimulator(aiProvidersEnvVars);
  } catch (error) {
    console.error(error);
    return;
  }

  // Run the GenLayer Simulator
  console.log("Running the GenLayer Simulator...");
  try {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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

  // Ollama doesn't need changes in configuration, we just run it
  if (selectedLlmProviders.includes("ollama")) {
    console.log("Pulling llama3 from Ollama...");
    await simulatorService.pullOllamaModel();
  }

  // Initializing validators
  console.log("Initializing validators...");
  try {
    //remove all validators
    await simulatorService.deleteAllValidators();
    // create random validators
    await simulatorService.createRandomValidators(Number(options.numValidators), selectedLlmProviders);
  } catch (error) {
    console.error("Unable to initialize the validators.");
    console.error(error);
    return;
  }

  // Simulator ready
  console.log(
    `GenLayer simulator initialized successfully! Go to ${simulatorService.getFrontendUrl()} in your browser to access it.`,
  );
  try {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    simulatorService.openFrontend();
  } catch (error) {
    console.error(error);
  }
}
