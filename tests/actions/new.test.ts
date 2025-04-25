import { describe, test, vi, beforeEach, afterEach, expect } from "vitest";
import fs from "fs-extra";
import path from "path";
import { NewAction } from "../../src/commands/scaffold/new";

vi.mock("fs-extra");

describe("NewAction", () => {
  let newAction: NewAction;
  let mockExistsSync: any;
  let mockCopySync: any;

  beforeEach(() => {
    vi.clearAllMocks();
    newAction = new NewAction();

    mockExistsSync = vi.mocked(fs.existsSync);
    mockCopySync = vi.mocked(fs.copySync);

    vi.spyOn(newAction as any, "startSpinner").mockImplementation(() => {});
    vi.spyOn(newAction as any, "succeedSpinner").mockImplementation(() => {});
    vi.spyOn(newAction as any, "failSpinner").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should successfully create a new project", async () => {
    mockExistsSync.mockReturnValue(false);
    mockCopySync.mockImplementation(() => {});

    await newAction.createProject("myProject", { path: ".", overwrite: false });

    expect(newAction["startSpinner"]).toHaveBeenCalledWith("Creating new GenLayer project: myProject");
    expect(mockCopySync).toHaveBeenCalledWith(expect.any(String), path.resolve(".", "myProject"));
    expect(newAction["succeedSpinner"]).toHaveBeenCalledWith(
      `Project "myProject" created successfully at ${path.resolve(".", "myProject")}`
    );
  });

  test("should fail if project directory exists and overwrite is not set", async () => {
    mockExistsSync.mockReturnValue(true);

    await newAction.createProject("existingProject", { path: ".", overwrite: false });

    expect(newAction["failSpinner"]).toHaveBeenCalledWith(
      `Project directory "${path.resolve(".", "existingProject")}" already exists. Use --overwrite to replace it.`
    );
    expect(mockCopySync).not.toHaveBeenCalled();
  });

  test("should overwrite existing project if overwrite is set", async () => {
    mockExistsSync.mockReturnValue(true);
    mockCopySync.mockImplementation(() => {});

    await newAction.createProject("overwriteProject", { path: ".", overwrite: true });

    expect(newAction["startSpinner"]).toHaveBeenCalledWith("Creating new GenLayer project: overwriteProject");
    expect(mockCopySync).toHaveBeenCalledWith(expect.any(String), path.resolve(".", "overwriteProject"));
    expect(newAction["succeedSpinner"]).toHaveBeenCalledWith(
      `Project "overwriteProject" created successfully at ${path.resolve(".", "overwriteProject")}`
    );
  });

  test("should fail if an error occurs while copying files", async () => {
    mockExistsSync.mockReturnValue(false);
    const error = new Error("Mocked file system error");
    mockCopySync.mockImplementation(() => {
      throw error;
    });

    await newAction.createProject("errorProject", { path: ".", overwrite: false });

    expect(newAction["failSpinner"]).toHaveBeenCalledWith(
      "Error creating project \"errorProject\"",
      error
    );
  });
});