import inquirer from "inquirer";
import { rpcClient } from "../../lib/clients/jsonRpcClient";

export interface ValidatorOptions {
  address?: string;
}

export interface UpdateValidatorOptions {
  address: string;
  stake?: number;
  provider?: string;
  model?: string;
  config?: string;
}

export interface CreateRandomValidatorsOptions {
  count: string;
  providers: string[];
}

export interface CreateValidatorOptions {
  stake: string;
  config?: string;
}

export class ValidatorsAction {
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

  private async confirmPrompt(message: string): Promise<void> {
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

  public async createRandomValidators(options: CreateRandomValidatorsOptions): Promise<void> {
    try {
      const count = parseInt(options.count, 10);
      if (isNaN(count) || count < 1) {
        throw new Error("Invalid count. Please provide a positive integer.");
      }

      console.log(`Creating ${count} random validator(s)...`);
      console.log(`Providers: ${options.providers.length > 0 ? options.providers.join(", ") : "None"}`);

      const result = await rpcClient.request({
        method: "sim_createRandomValidators",
        params: [count, 1, 10, options.providers],
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
        throw new Error("Invalid stake. Please provide a positive integer.");
      }

      console.log("Fetching available providers and models...");

      const providersAndModels = await rpcClient.request({
        method: "sim_getProvidersAndModels",
        params: [],
      });

      if (!providersAndModels.result || providersAndModels.result.length === 0) {
        throw new Error("No providers or models available.");
      }

      const availableProviders = [
        ...new Map(
          providersAndModels.result
            .filter((entry: any) => entry.is_available)
            .map((entry: any) => [entry.provider, entry])
        ).values(),
      ];

      const { selectedProvider } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedProvider",
          message: "Select a provider:",
          choices: availableProviders.map((entry: any) => entry.provider),
        },
      ]);

      const availableModels = providersAndModels.result.filter(
        (entry: any) => entry.provider === selectedProvider && entry.is_model_available
      );

      if (availableModels.length === 0) {
        throw new Error("No models available for the selected provider.");
      }

      const { selectedModel } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedModel",
          message: "Select a model:",
          choices: availableModels.map((entry: any) => entry.model),
        },
      ]);

      const modelDetails = availableModels.find(
        (entry: any) => entry.model === selectedModel
      );

      if (!modelDetails) {
        throw new Error("Selected model details not found.");
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
