export const DEFAULT_JSON_RPC_URL = "http://localhost:4000/api";
export const DEFAULT_REPO_GH_URL = "https://github.com/yeagerai/genlayer-simulator.git";
export const DEFAULT_RUN_SIMULATOR_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && docker compose build && docker compose up"'`,
  win32: `start cmd.exe /c "cd /d ${simulatorLocation} && docker compose build && docker compose up && pause"`,
  linux: `x-terminal-emulator -e bash -c 'cd ${simulatorLocation} && docker compose build && docker compose up; echo "Press enter to exit"; read'`,
});
export const DEFAULT_PULL_OLLAMA_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && docker exec ollama ollama pull llama2"'`,
  win32: `start cmd.exe /c "cd /d ${simulatorLocation} && docker exec ollama ollama pull llama2"`,
  linux: `x-terminal-emulator -e bash -c 'cd ${simulatorLocation} && docker exec ollama ollama pull llama2'`,
});
export const AVAILABLE_PLATFORMS = ["darwin", "win32", "linux"] as const;
export type RunningPlatform = (typeof AVAILABLE_PLATFORMS)[number];
export const STARTING_TIMEOUT_WAIT_CYLCE = 2000;
export const STARTING_TIMEOUT_ATTEMPTS = 120;

export type AiProviders = "ollama" | "openai";
export type AiProvidersEnvVars = "ollama" | "OPENAIKEY";
export type AiProvidersConfigType = {
  [key in AiProviders]: {name: string; envVar: AiProvidersEnvVars; cliOptionValue: string};
};

export const AI_PROVIDERS_CONFIG: AiProvidersConfigType = {
  ollama: {name: "Ollama (This will download and run a local instance of Llama 2)", envVar: "ollama", cliOptionValue: "ollama"},
  openai: {name: "OpenAI (You will need to provide an OpenAI API key)", envVar: "OPENAIKEY", cliOptionValue: "openai"},
};
