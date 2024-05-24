import {AiProviders} from "../config/simulator";

export interface ISimulatorService {
  getSimulatorLocation(): string;
  readEnvConfigValue(key: string): string;
  addConfigToEnvFile(newConfig: Record<string, string>): void;
  checkRequirements(): Promise<Record<string, boolean>>;
  downloadSimulator(): Promise<DownloadSimulatorResultType>;
  updateSimulator(): Promise<DownloadSimulatorResultType>;
  pullOllamaModel(): Promise<boolean>;
  configSimulator(newConfig: Record<string, string>): Promise<boolean>;
  runSimulator(): Promise<{stdout: string; stderr: string}>;
  waitForSimulatorToBeReady(retries?: number): Promise<WaitForSimulatorToBeReadyResultType>;
  clearAccountsAndTransactionsDatabase(): Promise<any>;
  initializeDatabase(): Promise<InitializeDatabaseResultType>;
  createRandomValidators(numValidators: number, llmProviders: AiProviders[]): Promise<any>;
  deleteAllValidators(): Promise<any>;
  getAiProvidersOptions(withHint: boolean): Array<{name: string; value: string}>;
  getFrontendUrl(): string;
  openFrontend(): Promise<boolean>;
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
