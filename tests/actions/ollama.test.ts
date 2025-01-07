import {describe, test, vi, beforeEach, afterEach, expect, Mock} from "vitest";
import { OllamaAction } from "../../src/commands/update/ollama";
import Docker from "dockerode";

vi.mock("dockerode");

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
    mockStream.on.mockImplementation((event: any, callback:any) => {
      if (event === "data") callback(Buffer.from("Mocked output"));
      if (event === "end") callback();
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
    expect(console.log).toHaveBeenCalledWith("Mocked output");
    expect(console.log).toHaveBeenCalledWith('Model "mocked_model" updated successfully');
  });

  test("should remove the model using 'rm'", async () => {
    mockStream.on.mockImplementation((event:any, callback:any) => {
      if (event === "data") callback(Buffer.from("Mocked output"));
      if (event === "end") callback();
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
    expect(console.log).toHaveBeenCalledWith("Mocked output");
    expect(console.log).toHaveBeenCalledWith('Model "mocked_model" removed successfully');
  });

  test("should log an error if an exception occurs during 'pull'", async () => {
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
});
