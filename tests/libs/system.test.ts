import { describe, test, expect, vi, beforeEach } from "vitest";
import util from "node:util";
import {
  checkCommand,
  executeCommand,
  openUrl,
  getVersion,
  listDockerContainers,
  listDockerImages,
  stopDockerContainer,
  removeDockerContainer,
  removeDockerImage
} from "../../src/lib/clients/system";
import { MissingRequirementError } from "../../src/lib/errors/missingRequirement";
import open from "open";

vi.mock("open");
vi.mock("util");

describe("System Functions - Success Paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("openUrl opens URL successfully", async () => {
    const openSpy = vi.mocked(open).mockResolvedValue({} as any);
    const url = "https://example.com";
    await openUrl(url);
    expect(openSpy).toHaveBeenCalledWith(url);
  });

  test("getVersion retrieves tool version", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "git v1.2.3",
      stderr: ""
    }));
    const version = await getVersion("git");
    expect(version).toBe("1.2.3");
  });

  test("checkCommand verifies a command exists", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({ stdout: "", stderr: "" }));
    const result = await checkCommand("node --version", "node");
    expect(result).toBe(undefined);
  });

  test("executeCommand executes a command successfully", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    vi.mocked(util.promisify).mockReturnValueOnce((param: string) => Promise.resolve({
      stdout: param,
      stderr: ""
    }));
    const result = await executeCommand({
        linux: "echo linux",
        win32: "echo win32",
        darwin: "echo darwin",
      },
      "echo");
    expect(result.stdout).toBe("echo linux");
    platformSpy.mockRestore();
  });

  test("listDockerContainers retrieves a list of containers", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "container1\ncontainer2",
      stderr: ""
    }));
    const containers = await listDockerContainers();
    expect(containers).toEqual(["container1", "container2"]);
  });

  test("listDockerImages retrieves a list of images", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "image1\nimage2",
      stderr: ""
    }));
    const images = await listDockerImages();
    expect(images).toEqual(["image1", "image2"]);
  });

  test("stopDockerContainer stops a container", async () => {
    const containerId = "container123";
    const execMock = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    vi.mocked(util.promisify).mockReturnValue(execMock);
    await stopDockerContainer(containerId);
    expect(execMock).toHaveBeenCalledWith(`docker stop ${containerId}`);
  });

  test("removeDockerContainer removes a container", async () => {
    const containerId = "container123";
    const execMock = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    vi.mocked(util.promisify).mockReturnValue(execMock);
    await removeDockerContainer(containerId);
    expect(execMock).toHaveBeenCalledWith(`docker rm ${containerId}`);
  });

  test("removeDockerImage removes an image", async () => {
    const imageId = "image123";
    const execMock = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    vi.mocked(util.promisify).mockReturnValue(execMock);
    await removeDockerImage(imageId);
    expect(execMock).toHaveBeenCalledWith(`docker rmi ${imageId}`);
  });
});

describe("System Functions - Error Paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("getVersion throws an error if the command fails", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "",
      stderr: "command not found"
    }));
    const toolName = "nonexistent";
    await expect(getVersion(toolName)).rejects.toThrow(`Error getting ${toolName} version.`);
  });

  test("getVersion returns '' if stdout is empty", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "",
      stderr: ""
    }));
    const result = await getVersion('git');
    expect(result).toBe("");
  });

  test("getVersion throw error if stdout undefined", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stderr: ""
    }));
    const toolName = "nonexistent";
    await expect(getVersion(toolName)).rejects.toThrow(`Error getting ${toolName} version.`);
  });

  test("checkCommand returns false if the command does not exist", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.resolve({
      stdout: "",
      stderr: "command not found"
    }));
    const toolName = 'nonexistent';
    await expect(checkCommand(`${toolName} --version`, toolName)).rejects.toThrow(new MissingRequirementError(toolName));
  });

  test("executeCommand throws an error if the command fails", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("Execution failed")));
    await expect(executeCommand({
        linux: "echo hello",
        win32: "echo hello",
        darwin: "echo hello",
      },
      "echo")).rejects.toThrow("Execution failed");
  });

  test("stopDockerContainer throws an error if stopping fails", async () => {
    const containerId = "container123";
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("")));
    await expect(stopDockerContainer(containerId)).rejects.toThrow("Error stopping Docker container container123");
  });

  test("removeDockerContainer throws an error if removal fails", async () => {
    const containerId = "container123";
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("")));
    await expect(removeDockerContainer(containerId)).rejects.toThrow("Error removing container container123.");
  });

  test("removeDockerImage throws an error if image removal fails", async () => {
    const imageId = "image123";
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("")));
    await expect(removeDockerImage(imageId)).rejects.toThrow("Error removing image image123.");
  });

  test("throws error when command fails", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("")));
    await expect(listDockerContainers()).rejects.toThrow("Error listing Docker containers.");
  });

  test("throws error when command fails", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("")));
    await expect(listDockerImages()).rejects.toThrow("Error listing Docker images.");
  });

  test("throws error when command execution fails", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("Execution error.")));
    await expect(executeCommand({
      linux: "echo no toolname",
      win32: "echo no toolname",
      darwin: "echo no toolname",
    })).rejects.toThrow(
      "Error executing echo no toolname: Execution error."
    );
  });

  test("throws error when command execution fails (toolname)", async () => {
    vi.mocked(util.promisify).mockReturnValueOnce(() => Promise.reject(new Error("Execution error.")));
    await expect(executeCommand({
        linux: "echo linux",
        win32: "echo win32",
        darwin: "echo darwin",
      },
      "echo")).rejects.toThrow(
      "Error executing echo: Execution error."
    );
  });

  test("throws an error for unsupported platform in executeCommand", () => {
    const unsupportedPlatform = "unsupportedOS";
    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", {
      value: unsupportedPlatform,
    });
    const cmdsByPlatform = {
      linux: "echo Linux",
      darwin: "echo macOS",
      win32: "echo Windows",
    };
    expect(executeCommand(cmdsByPlatform)).rejects.toThrow(
      `Unsupported platform: ${unsupportedPlatform}.`
    );
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });
});