import {program} from "commander";

import {initializeGeneralCommands} from "../../src/commands/general";
// import {getCommand} from "../utils";

describe("init command", () => {
  // const initCommand = getCommand("init");
  initializeGeneralCommands(program);

  beforeEach(() => {
    // jest.clearAllMocks();
    // const action = jest.fn();
    // initCommand?.action(action);
  });

  test("doesnt have required arguments nor options", async () => {
    program.parse(["node", "test", "init"]);
  });
});
