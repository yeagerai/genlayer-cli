import { describe, test, vi, beforeEach, afterEach, expect, Mock } from "vitest";
import { OllamaAction } from "../../src/commands/update/ollama";
import { rpcClient } from "../../src/lib/clients/jsonRpcClient";

import Docker from "dockerode";

vi.mock("dockerode");
vi.mock("../../src/lib/clients/jsonRpcClient");

describe("OllamaAction", () => {
  let ollamaAction: OllamaAction;
  let mockGetContainer: Mock;
  let mockExec: Mock;
  let mockStart: Mock;
  let mockStream: any;

  beforeEach(() => {
    vi.clearAllMocks();
    ollamaAction = new OllamaAction();

    mockGetContainer = vi.mocked(Docker.prototype.getContainer);
    mockExec = vi.fn();
    mockStart = vi.fn();

    mockStream = {
      on: vi.fn(),
    };

    mockExec.mockResolvedValue({
      start: mockStart,
    });

    mockStart.mockResolvedValue(mockStream);

    mockGetContainer.mockReturnValue({
      exec: mockExec,
    } as unknown as Docker.Container);

    Docker.prototype.getContainer = mockGetContainer;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should update the model using 'pull'", async () => {
    const mockProvider = {
      plugin: "ollama",
      config: { key: "value" },
      plugin_config: { pluginKey: "pluginValue" },
    };
    vi.mocked(rpcClient.request).mockResolvedValueOnce({
      result: [mockProvider],
    });

    mockStream.on.mockImplementation((event: any, callback: any) => {
      if (event === "data") {
        callback(Buffer.from("Mocked output success"));
      }
      if (event === "end") {
        // Ensure the success flag is true
        callback();
      }
    });

    console.log = vi.fn();

    await ollamaAction.updateModel("mocked_model");

    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(mockExec).toHaveBeenCalledWith({
      Cmd: ["ollama", "pull", "mocked_model"],
      AttachStdout: true,
      AttachStderr: true,
    });
    expect(mockStart).toHaveBeenCalledWith({ Detach: false, Tty: false });
    expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(console.log).toHaveBeenCalledWith("Mocked output success");
    expect(console.log).toHaveBeenCalledWith('Model "mocked_model" updated successfully');
  });

  test("should remove the model using 'rm'", async () => {
    // Simulate success by setting the success flag in the `data` event
    mockStream.on.mockImplementation((event: any, callback: any) => {
      if (event === "data") {
        callback(Buffer.from("Mocked output success"));
      }
      if (event === "end") {
        // Ensure the success flag is true
        callback();
      }
    });

    console.log = vi.fn();

    await ollamaAction.removeModel("mocked_model");

    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(mockExec).toHaveBeenCalledWith({
      Cmd: ["ollama", "rm", "mocked_model"],
      AttachStdout: true,
      AttachStderr: true,
    });
    expect(mockStart).toHaveBeenCalledWith({ Detach: false, Tty: false });
    expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(console.log).toHaveBeenCalledWith("Mocked output success");
    expect(console.log).toHaveBeenCalledWith('Model "mocked_model" removed successfully');
  });

  test("should log an error if an exception occurs during 'pull'", async () => {
    const mockProvider = {
      plugin: "ollama",
      config: { key: "value" },
      plugin_config: { pluginKey: "pluginValue" },
    };
    vi.mocked(rpcClient.request).mockResolvedValueOnce({
      result: [mockProvider],
    });

    const error = new Error("Mocked error");
    mockGetContainer.mockReturnValueOnce(
      {
        exec: () => {
          throw new Error("Mocked error");
        }
      }
    );
    console.error = vi.fn();

    await ollamaAction.updateModel("mocked_model");

    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(console.error).toHaveBeenCalledWith(
      'Error executing command "pull" on model "mocked_model":',
      error
    );
  });

  test("should log an error if an exception occurs during 'rm'", async () => {
    const error = new Error("Mocked error");
    mockGetContainer.mockReturnValueOnce(
      {
        exec: () => {
          throw new Error("Mocked error");
        }
      }
    );

    console.error = vi.fn();

    await ollamaAction.removeModel("mocked_model");

    expect(mockGetContainer).toHaveBeenCalledWith("ollama");
    expect(console.error).toHaveBeenCalledWith(
      'Error executing command "rm" on model "mocked_model":',
      error
    );
  });

  test("should throw an error if no 'ollama' provider exists during updateModel", async () => {
    vi.mocked(rpcClient.request).mockResolvedValueOnce({
      result: [],
    });

    const modelName = "mocked_model";

    await expect(ollamaAction.updateModel(modelName)).rejects.toThrowError(
      "No existing 'ollama' provider found. Unable to add/update a model."
    );

    expect(rpcClient.request).toHaveBeenCalledWith({
      method: "sim_getProvidersAndModels",
      params: [],
    });
  });

  test("should reject with an error if success is not set to true", async () => {
    console.error = vi.fn();

    const mockProvider = {
      plugin: "ollama",
      config: { key: "value" },
      plugin_config: { pluginKey: "pluginValue" },
    };

    vi.mocked(rpcClient.request).mockResolvedValueOnce({
      result: [mockProvider],
    });

    mockStream.on.mockImplementation((event: any, callback: any) => {
      if (event === "data") {
        callback(Buffer.from("Mocked output failure"));
      }
      if (event === "end") {
        callback();
      }
    });

    console.log = vi.fn();
    console.error = vi.fn();

    await ollamaAction.updateModel("mocked_model");

    expect(console.error).toHaveBeenCalledWith(
      'Error executing command "pull" on model "mocked_model":', 'internal error'
    );
  });

});
