export const DEFAULT_JSON_RPC_URL = "http://localhost:4000/api";
export const DEFAULT_REPO_GH_URL = "https://github.com/yeagerai/genlayer-simulator.git";
export const DOCKER_IMAGES_AND_CONTAINERS_NAME_PREFIX = "genlayer-simulator-";
export const DEFAULT_RUN_SIMULATOR_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && docker compose build && docker compose up"'`,
  win32: `start cmd.exe /c "cd /d ${simulatorLocation} && docker compose build && docker compose up && pause"`,
  linux: `x-terminal-emulator -e bash -c 'cd ${simulatorLocation} && docker compose build && docker compose up; echo "Press enter to exit"; read'`,
});
export const DEFAULT_PULL_OLLAMA_COMMAND = (simulatorLocation: string) => ({
  darwin: `cd ${simulatorLocation} && docker exec ollama ollama pull llama3`,
  win32: `cd /d ${simulatorLocation} && docker exec ollama ollama pull llama3`,
  linux: `cd ${simulatorLocation} && docker exec ollama ollama pull llama3`,
});
export const DEFAULT_RUN_DOCKER_COMMAND = {
  darwin: "open -a Docker",
  win32: 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"',
  linux: "sudo systemctl start docker",
};

export const VERSION_REQUIREMENTS = {
  docker: "25.0.0",
  node: "20.0.0",
};

export const AVAILABLE_PLATFORMS = ["darwin", "win32", "linux"] as const;
export type RunningPlatform = (typeof AVAILABLE_PLATFORMS)[number];
export const STARTING_TIMEOUT_WAIT_CYLCE = 2000;
export const STARTING_TIMEOUT_ATTEMPTS = 120;

export type AiProviders = "ollama" | "openai" | "heuristai";
export type AiProvidersEnvVars = "ollama" | "OPENAIKEY" | "HEURISTAIAPIKEY";
export type AiProvidersConfigType = {
  [key in AiProviders]: {name: string; hint: string; envVar?: AiProvidersEnvVars; cliOptionValue: string};
};

export const AI_PROVIDERS_CONFIG: AiProvidersConfigType = {
  ollama: {
    name: "Ollama",
    hint: "(This will download and run a local instance of Llama 3)",
    cliOptionValue: "ollama",
  },
  openai: {
    name: "OpenAI",
    hint: "(You will need to provide an OpenAI API key)",
    envVar: "OPENAIKEY",
    cliOptionValue: "openai",
  },
  heuristai: {
    name: "Heurist",
    hint: '(You will need to provide an API key. Get free API credits at https://dev-api-form.heurist.ai/ with referral code: "genlayer")',
    envVar: "HEURISTAIAPIKEY",
    cliOptionValue: "heuristai",
  },
};
