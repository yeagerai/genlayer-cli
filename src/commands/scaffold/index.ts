import { Command } from "commander";
import { NewAction } from "./new";

export function initializeScaffoldCommands(program: Command) {
  program
    .command("new <projectName>")
    .description("Create a new GenLayer project using the default template")
    .option("--path <directory>", "Specify the directory for the new project", ".")
    .option("--overwrite", "Overwrite existing directory if it exists", false)
    .action(async (projectName, options) => {
      const newProjectAction = new NewAction();
      await newProjectAction.createProject(projectName, options);
    });

  return program;
}
