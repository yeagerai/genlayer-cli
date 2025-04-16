import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { BaseAction } from "../../lib/actions/BaseAction";

export class NewAction extends BaseAction {
  private templatePath: string;

  constructor() {
    super();
    const __filename = fileURLToPath(import.meta.url);
    const basePath = path.resolve(path.dirname(__filename), "..");
    this.templatePath = path.join(basePath, "templates", "default");
  }

  async createProject(projectName: string, options: { path: string; overwrite: boolean }) {
    const targetPath = path.resolve(options.path, projectName);

    if (fs.existsSync(targetPath) && !options.overwrite) {
      return this.failSpinner(
        `Project directory "${targetPath}" already exists. Use --overwrite to replace it.`
      );
    }

    this.startSpinner(`Creating new GenLayer project: ${projectName}`);

    try {
      fs.copySync(this.templatePath, targetPath);
      this.succeedSpinner(`Project "${projectName}" created successfully at ${targetPath}`);
    } catch (error) {
      this.failSpinner(`Error creating project "${projectName}"`, error);
    }
  }
}
