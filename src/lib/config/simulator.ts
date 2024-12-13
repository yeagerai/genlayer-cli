export const DEFAULT_JSON_RPC_URL = "http://localhost:4000/api";
export const CONTAINERS_NAME_PREFIX = "/genlayer-";
export const IMAGES_NAME_PREFIX = "yeagerai";
export const DEFAULT_RUN_SIMULATOR_COMMAND = (location: string, options: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${location} && docker compose build && docker compose -p genlayer up ${options}"'`,
  win32: `start cmd.exe /c "cd /d ${location} && docker compose build && docker compose -p genlayer up ${options} && pause"`,
  linux: `nohup bash -c 'cd ${location} && docker compose build && docker compose -p genlayer up ${options} -d '`,
});
export const DEFAULT_RUN_DOCKER_COMMAND = {
  darwin: "open -a Docker",
  win32: 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"',
  linux: "sudo systemctl start docker",
};

export const VERSION_REQUIREMENTS = {
  docker: "25.0.0",
  node: "18.0.0",
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
