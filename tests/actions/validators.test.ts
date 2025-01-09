import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import { ValidatorsAction } from "../../src/commands/validators/validators";
import { rpcClient } from "../../src/lib/clients/jsonRpcClient";
import inquirer from "inquirer";

vi.mock("../../src/lib/clients/jsonRpcClient", () => ({
  rpcClient: {
    request: vi.fn(),
  },
}));

vi.mock("inquirer");

describe("ValidatorsAction", () => {
  let validatorsAction: ValidatorsAction;

  beforeEach(() => {
    vi.clearAllMocks();
    validatorsAction = new ValidatorsAction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getValidator", () => {
    test("should fetch a specific validator by address", async () => {
      const mockAddress = "mocked_address";
      const mockResponse = { result: { id: 1, name: "Validator1" } };
      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.log = vi.fn();

      await validatorsAction.getValidator({ address: mockAddress });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(console.log).toHaveBeenCalledWith("Validator Details:", mockResponse.result);
    });

    test("should fetch all validators when no address is provided", async () => {
      const mockResponse = { result: [{ id: 1 }, { id: 2 }] };
      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.log = vi.fn();

      await validatorsAction.getValidator({});

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getAllValidators",
        params: [],
      });
      expect(console.log).toHaveBeenCalledWith("All Validators:", mockResponse.result);
    });

    test("should log an error if an exception occurs while fetching a specific validator", async () => {
      const mockAddress = "mocked_address";
      const mockError = new Error("Unexpected error");

      vi.mocked(rpcClient.request).mockRejectedValue(mockError);

      console.error = vi.fn();

      await validatorsAction.getValidator({ address: mockAddress });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(console.error).toHaveBeenCalledWith("Error fetching validators:", mockError);
    });

    test("should log an error if an exception occurs while fetching all validators", async () => {
      const mockError = new Error("Unexpected error");

      vi.mocked(rpcClient.request).mockRejectedValue(mockError);

      console.error = vi.fn();

      await validatorsAction.getValidator({});

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getAllValidators",
        params: [],
      });
      expect(console.error).toHaveBeenCalledWith("Error fetching validators:", mockError);
    });
  });

  describe("deleteValidator", () => {
    test("should delete a specific validator", async () => {
      const mockAddress = "mocked_address";
      vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: true });
      vi.mocked(rpcClient.request).mockResolvedValue({ result: { id: 1 } });

      console.log = vi.fn();

      await validatorsAction.deleteValidator({ address: mockAddress });

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_deleteValidator",
        params: [mockAddress],
      });
      expect(console.log).toHaveBeenCalledWith("Deleted Address:", { id: 1 });
    });

    test("should delete all validators when no address is provided", async () => {
      vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: true });
      vi.mocked(rpcClient.request).mockResolvedValue({});

      console.log = vi.fn();

      await validatorsAction.deleteValidator({});

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_deleteAllValidators",
        params: [],
      });
      expect(console.log).toHaveBeenCalledWith("Successfully deleted all validators");
    });

    test("should abort deletion if user declines confirmation", async () => {
      vi.mocked(inquirer.prompt).mockResolvedValue({ confirmAction: false });

      console.log = vi.fn();

      await validatorsAction.deleteValidator({ address: "mocked_address" })

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("Operation aborted!");
      expect(rpcClient.request).not.toHaveBeenCalled();
    });
  });

  describe("countValidators", () => {
    test("should count all validators", async () => {
      const mockResponse = { result: 42 };
      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.log = vi.fn();

      await validatorsAction.countValidators();

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_countValidators",
        params: [],
      });
      expect(console.log).toHaveBeenCalledWith("Total Validators:", 42);
    });

    test("should log an error if an exception occurs while counting validators", async () => {
      const mockError = new Error("Unexpected error");

      vi.mocked(rpcClient.request).mockRejectedValue(mockError);

      console.error = vi.fn();

      await validatorsAction.countValidators();

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_countValidators",
        params: [],
      });
      expect(console.error).toHaveBeenCalledWith("Error counting validators:", mockError);
    });
  });

  describe("createValidator", () => {
    test("should create a validator with selected provider and model", async () => {
      const mockProvidersAndModels = [
        {
          provider: "Provider1",
          is_available: true,
          is_model_available: true,
          model: "Model1",
          config: { max_tokens: 500 },
          plugin: "Plugin1",
          plugin_config: { api_key_env_var: "KEY1" },
        },
      ];
      const mockResponse = { result: { id: 123 } };

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce({ result: mockProvidersAndModels })
        .mockResolvedValueOnce(mockResponse);

      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ selectedProvider: "Provider1" })
        .mockResolvedValueOnce({ selectedModel: "Model1" });

      console.log = vi.fn();

      await validatorsAction.createValidator({ stake: "10" });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getProvidersAndModels",
        params: [],
      });
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_createValidator",
        params: [
          10,
          "Provider1",
          "Model1",
          { max_tokens: 500 },
          "Plugin1",
          { api_key_env_var: "KEY1" },
        ],
      });
      expect(console.log).toHaveBeenCalledWith("Validator successfully created:", { id: 123 });
    });

    test("should log an error for invalid stake", async () => {
      console.error = vi.fn();

      await validatorsAction.createValidator({ stake: "invalid" });

      expect(console.error).toHaveBeenCalledWith("Invalid stake. Please provide a positive integer.");
      expect(rpcClient.request).not.toHaveBeenCalled();
    });

    test("should log an error if no providers or models are available", async () => {
      vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: [] });

      console.error = vi.fn();

      await validatorsAction.createValidator({ stake: "10" });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getProvidersAndModels",
        params: [],
      });
      expect(console.error).toHaveBeenCalledWith("No providers or models available.");
    });

    test("should log an error if no models are available for the selected provider", async () => {
      const mockProvidersAndModels = [
        { provider: "Provider1", is_available: true, is_model_available: false },
      ];

      vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: mockProvidersAndModels });
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ selectedProvider: "Provider1" });

      console.error = vi.fn();

      await validatorsAction.createValidator({ stake: "10" });

      expect(console.error).toHaveBeenCalledWith("No models available for the selected provider.");
    });

    test("should log an error if selected model details are not found", async () => {
      const mockProvidersAndModels = [
        {
          provider: "Provider1",
          is_available: true,
          is_model_available: true,
          model: "Model1",
        },
      ];

      vi.mocked(rpcClient.request).mockResolvedValueOnce({ result: mockProvidersAndModels });
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ selectedProvider: "Provider1" })
        .mockResolvedValueOnce({ selectedModel: "NonExistentModel" });

      console.error = vi.fn();

      await validatorsAction.createValidator({ stake: "10" });

      expect(console.error).toHaveBeenCalledWith("Selected model details not found.");
    });

    test("should log an error if an exception occurs during the process", async () => {
      const mockError = new Error("Unexpected error");
      vi.mocked(rpcClient.request).mockRejectedValue(mockError);

      console.error = vi.fn();

      await validatorsAction.createValidator({ stake: "10" });

      expect(console.error).toHaveBeenCalledWith("Error creating validator:", mockError);
    });

    test("should use user-provided config if specified", async () => {
      const mockProvidersAndModels = [
        {
          provider: "Provider1",
          is_available: true,
          is_model_available: true,
          model: "Model1",
          config: { max_tokens: 500 },
          plugin: "Plugin1",
          plugin_config: { api_key_env_var: "KEY1" },
        },
      ];
      const mockResponse = { result: { id: 123 } };

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce({ result: mockProvidersAndModels })
        .mockResolvedValueOnce(mockResponse);

      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ selectedProvider: "Provider1" })
        .mockResolvedValueOnce({ selectedModel: "Model1" });

      console.log = vi.fn();

      const customConfig = '{"custom_key":"custom_value"}';
      await validatorsAction.createValidator({ stake: "10", config: customConfig });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_createValidator",
        params: [
          10,
          "Provider1",
          "Model1",
          { custom_key: "custom_value" },
          "Plugin1",
          { api_key_env_var: "KEY1" },
        ],
      });
      expect(console.log).toHaveBeenCalledWith("Validator successfully created:", { id: 123 });
    });
  });
  describe("createRandomValidators", () => {
    test("should create random validators with valid count and providers", async () => {
      const mockResponse = { result: { success: true } };
      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.log = vi.fn();

      await validatorsAction.createRandomValidators({ count: "5", providers: ["Provider1", "Provider2"] });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_createRandomValidators",
        params: [5, 1, 10, ["Provider1", "Provider2"]],
      });
      expect(console.log).toHaveBeenCalledWith("Creating 5 random validator(s)...");
      expect(console.log).toHaveBeenCalledWith("Providers: Provider1, Provider2");
      expect(console.log).toHaveBeenCalledWith("Random validators successfully created:", mockResponse.result);
    });

    test("should create random validators with default provider message when providers list is empty", async () => {
      const mockResponse = { result: { success: true } };
      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.log = vi.fn();

      await validatorsAction.createRandomValidators({ count: "3", providers: [] });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_createRandomValidators",
        params: [3, 1, 10, []],
      });
      expect(console.log).toHaveBeenCalledWith("Creating 3 random validator(s)...");
      expect(console.log).toHaveBeenCalledWith("Providers: None");
      expect(console.log).toHaveBeenCalledWith("Random validators successfully created:", mockResponse.result);
    });

    test("should throw an error for invalid count", async () => {
      console.error = vi.fn();

      await validatorsAction.createRandomValidators({ count: "invalid", providers: ["Provider1"] });

      expect(console.error).toHaveBeenCalledWith("Invalid count. Please provide a positive integer.");
      expect(rpcClient.request).not.toHaveBeenCalled();
    });

    test("should log an error if rpc request fails", async () => {
      const mockError = new Error("RPC failure");
      vi.mocked(rpcClient.request).mockRejectedValue(mockError);

      console.error = vi.fn();

      await validatorsAction.createRandomValidators({ count: "5", providers: ["Provider1"] });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_createRandomValidators",
        params: [5, 1, 10, ["Provider1"]],
      });
      expect(console.error).toHaveBeenCalledWith("Error creating random validators:", mockError);
    });
  });

  describe("updateValidator", () => {
    test("should fetch and update a validator with new stake", async () => {
      const mockAddress = "mocked_address";
      const mockCurrentValidator = {
        result: {
          address: "mocked_address",
          stake: 100,
          provider: "Provider1",
          model: "Model1",
          config: { max_tokens: 500 },
        },
      };
      const mockResponse = { result: { success: true } };

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce(mockCurrentValidator)
        .mockResolvedValueOnce(mockResponse);

      console.log = vi.fn();

      await validatorsAction.updateValidator({ address: mockAddress, stake: "200" });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_updateValidator",
        params: [
          "mocked_address",
          "200",
          "Provider1",
          "Model1",
          { max_tokens: 500 },
        ],
      });
      expect(console.log).toHaveBeenCalledWith("Validator successfully updated:", mockResponse.result);
    });

    test("should fetch and update a validator with new provider and model", async () => {
      const mockAddress = "mocked_address";
      const mockCurrentValidator = {
        result: {
          address: "mocked_address",
          stake: "100",
          provider: "Provider1",
          model: "Model1",
          config: { max_tokens: 500 },
        },
      };
      const mockResponse = { result: { success: true } };

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce(mockCurrentValidator)
        .mockResolvedValueOnce(mockResponse);

      console.log = vi.fn();

      await validatorsAction.updateValidator({
        address: mockAddress,
        provider: "Provider2",
        model: "Model2",
      });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_updateValidator",
        params: [
          "mocked_address",
          "100",
          "Provider2",
          "Model2",
          { max_tokens: 500 },
        ],
      });
      expect(console.log).toHaveBeenCalledWith("Validator successfully updated:", mockResponse.result);
    });

    test("should fetch and update a validator with new config", async () => {
      const mockAddress = "mocked_address";
      const mockCurrentValidator = {
        result: {
          address: "mocked_address",
          stake: "100",
          provider: "Provider1",
          model: "Model1",
          config: { max_tokens: 500 },
        },
      };
      const mockResponse = { result: { success: true } };

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce(mockCurrentValidator)
        .mockResolvedValueOnce(mockResponse);

      console.log = vi.fn();

      const newConfig = '{"max_tokens":1000}';
      await validatorsAction.updateValidator({ address: mockAddress, config: newConfig });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_updateValidator",
        params: [
          "mocked_address",
          "100",
          "Provider1",
          "Model1",
          { max_tokens: 1000 },
        ],
      });
      expect(console.log).toHaveBeenCalledWith("Validator successfully updated:", mockResponse.result);
    });

    test("should throw an error if validator is not found", async () => {
      const mockAddress = "mocked_address";
      const mockResponse = { result: null };

      vi.mocked(rpcClient.request).mockResolvedValue(mockResponse);

      console.error = vi.fn();

      await validatorsAction.updateValidator({ address: mockAddress });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error updating validator:",
        new Error(`Validator with address ${mockAddress} not found.`)
      );
      expect(rpcClient.request).toHaveBeenCalledTimes(1);
    });

    test("should log an error if updateValidator RPC call fails", async () => {
      const mockAddress = "mocked_address";
      const mockCurrentValidator = {
        result: {
          address: "mocked_address",
          stake: "100",
          provider: "Provider1",
          model: "Model1",
          config: { max_tokens: 500 },
        },
      };
      const mockError = new Error("RPC failure");

      vi.mocked(rpcClient.request)
        .mockResolvedValueOnce(mockCurrentValidator)
        .mockRejectedValueOnce(mockError);

      console.error = vi.fn();

      await validatorsAction.updateValidator({ address: mockAddress, stake: "200" });

      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_getValidator",
        params: [mockAddress],
      });
      expect(rpcClient.request).toHaveBeenCalledWith({
        method: "sim_updateValidator",
        params: [
          "mocked_address",
          "200",
          "Provider1",
          "Model1",
          { max_tokens: 500 },
        ],
      });
      expect(console.error).toHaveBeenCalledWith("Error updating validator:", mockError);
    });
  });
  test("should log an error for invalid stake value", async () => {
    const mockAddress = "mocked_address";
    const mockCurrentValidator = {
      result: {
        address: "mocked_address",
        stake: 100,
        provider: "Provider1",
        model: "Model1",
        config: { max_tokens: 500 },
      },
    };

    vi.mocked(rpcClient.request).mockResolvedValue(mockCurrentValidator);

    console.error = vi.fn();

    await validatorsAction.updateValidator({ address: mockAddress, stake: "-10" });

    expect(rpcClient.request).toHaveBeenCalledWith({
      method: "sim_getValidator",
      params: [mockAddress],
    });
    expect(console.error).toHaveBeenCalledWith("Invalid stake value. Stake must be a positive integer.");
    expect(rpcClient.request).toHaveBeenCalledTimes(1);
  });
  test("should log an error if model is provided without provider", async () => {
    console.error = vi.fn();

    await validatorsAction.createValidator({ stake: "10", model: "Model1" });

    expect(console.error).toHaveBeenCalledWith("You must specify a provider if using a model.");
    expect(rpcClient.request).not.toHaveBeenCalled();
  });
});