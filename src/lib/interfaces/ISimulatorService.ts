import {AiProviders} from "../config/simulator";

export interface ISimulatorService {
  getSimulatorLocation(): string;
  readEnvConfigValue(key: string): string;
  addConfigToEnvFile(newConfig: Record<string, string>): void;
  checkRequirements(): Promise<{
    requirementsInstalled: Record<string, boolean>;
    missingVersions: Record<string, string>;
  }>;
  downloadSimulator(branch?: string): Promise<DownloadSimulatorResultType>;
  updateSimulator(branch?: string): Promise<boolean>;
  pullOllamaModel(): Promise<boolean>;
  configSimulator(newConfig: Record<string, string>): Promise<boolean>;
  runSimulator(): Promise<{stdout: string; stderr: string}>;
  waitForSimulatorToBeReady(retries?: number): Promise<WaitForSimulatorToBeReadyResultType>;
  createRandomValidators(numValidators: number, llmProviders: AiProviders[]): Promise<any>;
  deleteAllValidators(): Promise<any>;
  getAiProvidersOptions(withHint: boolean): Array<{name: string; value: string}>;
  getFrontendUrl(): string;
  openFrontend(): Promise<boolean>;
  resetDockerContainers(): Promise<boolean>;
  resetDockerImages(): Promise<boolean>;
}

export type DownloadSimulatorResultType = {
  wasInstalled: boolean;
};

export type WaitForSimulatorToBeReadyResultType = {
  initialized: boolean;
  errorCode?: "TIMEOUT" | "ERROR";
  errorMessage?: string;
};

export type InitializeDatabaseResultType = {
  createResponse: any;
  tablesResponse: any;
};
