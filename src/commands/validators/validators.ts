import inquirer from "inquirer";
import { rpcClient } from "../../lib/clients/jsonRpcClient";
import { BaseAction } from "../../lib/actions/BaseAction";

export interface ValidatorOptions {
  address?: string;
}

export interface UpdateValidatorOptions {
  address: string;
  stake?: string;
  provider?: string;
  model?: string;
  config?: string;
}

export interface CreateRandomValidatorsOptions {
  count: string;
  providers: string[];
  models: string[];
}

export interface CreateValidatorOptions {
  stake: string;
  config?: string;
  model?: string;
  provider?: string;
}

export class ValidatorsAction extends BaseAction {
  public async getValidator(options: ValidatorOptions): Promise<void> {
    try {
      if (options.address) {
        console.log(`Fetching validator with address: ${options.address}`);

        const result = await rpcClient.request({
          method: "sim_getValidator",
          params: [options.address],
        });

        console.log("Validator Details:", result.result);
      } else {
        console.log("Fetching all validators...");

        const result = await rpcClient.request({
          method: "sim_getAllValidators",
          params: [],
        });

        console.log("All Validators:", result.result);
      }
    } catch (error) {
      console.error("Error fetching validators:", error);
    }
  }

  public async deleteValidator(options: ValidatorOptions): Promise<void> {
    try {
      if (options.address) {
        await this.confirmPrompt(`This command will delete the validator with the address: ${options.address}. Do you want to continue?`);
        console.log(`Deleting validator with address: ${options.address}`);

        const result = await rpcClient.request({
          method: "sim_deleteValidator",
          params: [options.address],
        });

        console.log("Deleted Address:", result.result);
      } else {
        await this.confirmPrompt(`This command will delete all validators. Do you want to continue?`);
        console.log("Deleting all validators...");

        await rpcClient.request({
          method: "sim_deleteAllValidators",
          params: [],
        });

        console.log("Successfully deleted all validators");
      }
    } catch (error) {
      console.error("Error deleting validators:", error);
    }
  }

  public async countValidators(): Promise<void> {
    try {
      console.log("Counting all validators...");

      const result = await rpcClient.request({
        method: "sim_countValidators",
        params: [],
      });

      console.log("Total Validators:", result.result);
    } catch (error) {
      console.error("Error counting validators:", error);
    }
  }

  public async updateValidator(options: UpdateValidatorOptions): Promise<void> {
    try {
      console.log(`Fetching validator with address: ${options.address}...`);
      const currentValidator = await rpcClient.request({
        method: "sim_getValidator",
        params: [options.address],
      });

      if (!currentValidator.result) {
        throw new Error(`Validator with address ${options.address} not found.`);
      }

      console.log("Current Validator Details:", currentValidator.result);

      const parsedStake = options.stake
        ? parseInt(options.stake, 10)
        : currentValidator.result.stake;

      if (isNaN(parsedStake) || parsedStake < 0) {
        return console.error("Invalid stake value. Stake must be a positive integer.");
      }

      const updatedValidator = {
        address: options.address,
        stake: options.stake || currentValidator.result.stake,
        provider: options.provider || currentValidator.result.provider,
        model: options.model || currentValidator.result.model,
        config: options.config ? JSON.parse(options.config) : currentValidator.result.config,
      };

      console.log("Updated Validator Details:", updatedValidator);

      const result = await rpcClient.request({
        method: "sim_updateValidator",
        params: [
          updatedValidator.address,
          updatedValidator.stake,
          updatedValidator.provider,
          updatedValidator.model,
          updatedValidator.config,
        ],
      });

      console.log("Validator successfully updated:", result.result);
    } catch (error) {
      console.error("Error updating validator:", error);
    }
  }

  public async createRandomValidators(options: CreateRandomValidatorsOptions): Promise<void> {
    try {
      const count = parseInt(options.count, 10);
      if (isNaN(count) || count < 1) {
        return console.error("Invalid count. Please provide a positive integer.");
      }

      console.log(`Creating ${count} random validator(s)...`);
      console.log(`Providers: ${options.providers.length > 0 ? options.providers.join(", ") : "None"}`);
      console.log(`Models: ${options.models.length > 0 ? options.models.join(", ") : "None"}`);

      const result = await rpcClient.request({
        method: "sim_createRandomValidators",
        params: [count, 1, 10, options.providers, options.models],
      });

      console.log("Random validators successfully created:", result.result);
    } catch (error) {
      console.error("Error creating random validators:", error);
    }
  }

  public async createValidator(options: CreateValidatorOptions): Promise<void> {
    try {
      const stake = parseInt(options.stake, 10);
      if (isNaN(stake) || stake < 1) {
        return console.error("Invalid stake. Please provide a positive integer.");
      }

      if (options.model && !options.provider) {
        return console.error("You must specify a provider if using a model.");
      }

      console.log("Fetching available providers and models...");

      const providersAndModels = await rpcClient.request({
        method: "sim_getProvidersAndModels",
        params: [],
      });

      if (!providersAndModels.result || providersAndModels.result.length === 0) {
        return console.error("No providers or models available.");
      }

      const availableProviders = [
        ...new Map(
          providersAndModels.result
            .filter((entry: any) => entry.is_available)
            .map((entry: any) => [entry.provider, entry])
        ).values(),
      ];

      let provider =  options.provider

      if(!provider){
        const { selectedProvider } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedProvider",
            message: "Select a provider:",
            choices: availableProviders.map((entry: any) => entry.provider),
          },
        ]);

        provider = selectedProvider;
      }

      const availableModels = providersAndModels.result.filter(
        (entry: any) => entry.provider === provider && entry.is_model_available
      );

      if (availableModels.length === 0) {
        return console.error("No models available for the selected provider.");
      }

      let model = options.model;

      if(!model){
        const { selectedModel } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedModel",
            message: "Select a model:",
            choices: availableModels.map((entry: any) => entry.model),
          },
        ]);

        model = selectedModel;
      }

      const modelDetails = availableModels.find(
        (entry: any) => entry.model === model
      );

      if (!modelDetails) {
        return console.error("Selected model details not found.");
      }

      const config = options.config ? JSON.parse(options.config) : modelDetails.config;

      console.log("Creating validator with the following details:");
      console.log(`Stake: ${stake}`);
      console.log(`Provider: ${modelDetails.provider}`);
      console.log(`Model: ${modelDetails.model}`);
      console.log(`Config:`, config);
      console.log(`Plugin:`, modelDetails.plugin);
      console.log(`Plugin Config:`, modelDetails.plugin_config);

      const result = await rpcClient.request({
        method: "sim_createValidator",
        params: [
          stake,
          modelDetails.provider,
          modelDetails.model,
          config,
          modelDetails.plugin,
          modelDetails.plugin_config,
        ],
      });

      console.log("Validator successfully created:", result.result);
    } catch (error) {
      console.error("Error creating validator:", error);
    }
  }
}
