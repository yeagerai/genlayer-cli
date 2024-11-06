import {AiProviders} from "../config/simulator";

export interface ISimulatorService {
  setSimulatorLocation(location: string): void;
  getSimulatorLocation(): string;
  checkInstallRequirements(): Promise<Record<string, boolean>>;
  checkVersionRequirements(): Promise<Record<string, string>>;
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
