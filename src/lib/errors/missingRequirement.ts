export class MissingRequirementError extends Error {
  requirement: string;

  constructor(requirement: string) {
    super(`${requirement} is not installed. Please install ${requirement}.`);
    this.name = "MissingRequirement";
    this.requirement = requirement;
  }
}
