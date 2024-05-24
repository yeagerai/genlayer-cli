/* eslint-disable import/no-named-as-default-member */
import {jest} from "@jest/globals";

import simulatorService from "../../src/lib/services/simulator";
import {initAction} from "../../src/commands/general/init";

jest.mock("inquirer", () => ({
  prompt: jest.fn(() => {}),
}));

// Default options for the action
const defaultActionOptions = {numValidators: 5};

describe("init action", () => {
  let error: jest.Mock<any>;
  let simServCheckRequirements: jest.Mock<any>;
  beforeEach(() => {
    jest.clearAllMocks();

    error = jest.spyOn(console, "error").mockImplementation(() => {}) as jest.Mock<any>;
    jest.spyOn(console, "log").mockImplementation(() => {});

    simServCheckRequirements = jest.spyOn(simulatorService, "checkRequirements") as jest.Mock<any>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("if both requirements are missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: false, docker: false});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      "Git and Docker are not installed. Please install them and try again.\n",
    );
  });

  test("if only docker is missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: true, docker: false});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Docker is not installed. Please install Docker and try again.\n");
  });

  test("if only git is missing, then the execution fails", async () => {
    // Given
    simServCheckRequirements.mockResolvedValue({git: false, docker: true});

    // When
    await initAction(defaultActionOptions, simulatorService);

    // Then
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Git is not installed. Please install Git and try again.\n");
  });
});
