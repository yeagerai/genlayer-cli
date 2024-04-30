export const DEFAULT_JSON_RPC_URL = "http://localhost:4000/api";
export const DEFAULT_REPO_GH_URL = "git@github.com:yeagerai/genlayer-simulator.git";
export const DEFAULT_CONFIG_SIMULATOR_COMMAND = (simulatorLocation: string) => ({
  darwin: `cd ${simulatorLocation} && cp .env.example .env`,
  win32: `cd /d ${simulatorLocation} && xcopy .env.example .env /Y`,
  linux: `cd ${simulatorLocation} && cp .env.example .env`,
});
export const DEFAULT_RUN_SIMULATOR_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && docker compose build && docker compose up"'`,
  win32: `start cmd.exe /c "cd /d ${simulatorLocation} && docker compose build && docker compose up"`,
  linux: `x-terminal-emulator -e bash -c 'cd ${simulatorLocation} && docker compose build && docker compose up; echo "Press enter to exit"; read'`,
});
export const DEFAULT_RUN_OLLAMA_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && docker exec -it ollama ollama run llama2"'`,
  win32: `start cmd.exe /k "cd /d ${simulatorLocation} && docker exec -it ollama ollama run llama2"`,
  linux: `x-terminal-emulator -e bash -c 'cd ${simulatorLocation} && docker exec -it ollama ollama run llama2; echo "Press enter to exit"; read'`,
});
export const AVAILABLE_PLATFORMS = ["darwin", "win32", "linux"] as const;
export type RunningPlatform = (typeof AVAILABLE_PLATFORMS)[number];
export const STARTING_TIMEOUT_WAIT_CYLCE = 2000;
export const STARTING_TIMEOUT_ATTEMPTS = 120;

export type AiProviders = "ollama" | "openai";
export type AiProvidersEnvVars = "ollama" | "GENVMOPENAIKEY";
export type AiProvidersConfigType = {
  [key in AiProviders]: {name: string; envVar: AiProvidersEnvVars; cliOptionValue: string};
};

export const AI_PROVIDERS_CONFIG: AiProvidersConfigType = {
  ollama: {name: "Ollama", envVar: "ollama", cliOptionValue: "ollama"},
  openai: {name: "OpenAI", envVar: "GENVMOPENAIKEY", cliOptionValue: "openai"},
};
