export class VersionRequiredError extends Error {
  tool: string;

  constructor(tool: string, requiredVersion: string) {
    super(`${tool} version ${requiredVersion} or higher is required. Please update ${tool}.`);
    this.name = "VersionRequired";
    this.tool = tool;
  }
}
