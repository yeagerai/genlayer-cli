import inquirer from "inquirer";
import {ISimulatorService} from "../../lib/interfaces/ISimulatorService";
import {AI_PROVIDERS_CONFIG, AiProviders} from "../../lib/config/simulator";
import { OllamaAction } from "../update/ollama";
import { ConfigFileManager } from "../../lib/config/ConfigFileManager";

export interface InitActionOptions {
  numValidators: number;
  headless: boolean;
  resetDb: boolean;
  localnetVersion: string;
}

function getRequirementsErrorMessage({docker}: Record<string, boolean>): string {

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
  simulatorService.setComposeOptions(options.headless);

  let localnetVersion = options.localnetVersion;

  if(localnetVersion !== 'latest'){
    localnetVersion = simulatorService.normalizeLocalnetVersion(localnetVersion);
  }
  await simulatorService.checkCliVersion();

  // Check if requirements are installed
  try {
    const requirementsInstalled = await simulatorService.checkInstallRequirements();
    const requirementErrorMessage = getRequirementsErrorMessage(requirementsInstalled);

    if (requirementErrorMessage) {
      console.error(requirementErrorMessage);
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // Check if the versions are correct
  try {
    const missingVersions = await simulatorService.checkVersionRequirements();
    const versionErrorMessage = getVersionErrorMessage(missingVersions);

    if (versionErrorMessage) {
      console.error(versionErrorMessage);
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
      message: `This command is going to reset GenLayer docker images and containers, providers API Keys, and GenLayer database (accounts, transactions, validators and logs). Contract code (gpy files) will be kept. Do you want to continue?`,
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
  simulatorService.addConfigToEnvFile(aiProvidersEnvVars);
  simulatorService.addConfigToEnvFile({LOCALNETVERSION: localnetVersion});

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

    const ollamaAction = new OllamaAction();
    const configManager = new ConfigFileManager();
    const config = configManager.getConfig()
    let ollamaModel = config.defaultOllamaModel;

    if(!config.defaultOllamaModel){
      configManager.writeConfig('defaultOllamaModel', 'llama3');
      ollamaModel = 'llama3'
    }

    console.log(`Pulling ${ollamaModel} from Ollama...`);

    await ollamaAction.updateModel(ollamaModel);
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

  if(options.resetDb){
    await simulatorService.cleanDatabase()
  }

  // Simulator ready
  let successMessage = "GenLayer simulator initialized successfully! "
  successMessage += options.headless ? '' :  `Go to ${simulatorService.getFrontendUrl()} in your browser to access it.`;
  console.log(successMessage);
  try {
    if(!options.headless){
      await simulatorService.openFrontend();
    }
  } catch (error) {
    console.error(error);
  }
}
