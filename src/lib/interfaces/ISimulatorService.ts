import {AiProviders} from "../config/simulator";

export interface ISimulatorService {
  setComposeOptions(headless: boolean): void;
  getComposeOptions(): string;
  checkInstallRequirements(): Promise<Record<string, boolean>>;
  checkVersionRequirements(): Promise<Record<string, string>>;
  pullOllamaModel(): Promise<boolean>;
  runSimulator(): Promise<{stdout: string; stderr: string}>;
  waitForSimulatorToBeReady(retries?: number): Promise<WaitForSimulatorToBeReadyResultType>;
  createRandomValidators(numValidators: number, llmProviders: AiProviders[]): Promise<any>;
  deleteAllValidators(): Promise<any>;
  getAiProvidersOptions(withHint: boolean): Array<{name: string; value: string}>;
  getFrontendUrl(): string;
  openFrontend(): Promise<boolean>;
  resetDockerContainers(): Promise<boolean>;
  resetDockerImages(): Promise<boolean>;
  checkCliVersion(): Promise<void>;
  cleanDatabase(): Promise<boolean>;
  addConfigToEnvFile(newConfig: Record<string, string>): void;
  normalizeLocalnetVersion(version: string): string;
}


export type WaitForSimulatorToBeReadyResultType = {
  initialized: boolean;
  errorCode?: "TIMEOUT" | "ERROR";
  errorMessage?: string;
};

export type InitializeDatabaseResultType = {
  createResponse: any;
  tablesResponse: any;
};
