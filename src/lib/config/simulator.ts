export const DEFAULT_JSON_RPC_URL = "http://localhost:4000";
export const DEFAULT_REPO_GH_URL = "git@github.com:yeagerai/genlayer-simulator.git";
export const DEFAULT_RUN_SIMULATOR_COMMAND = (simulatorLocation: string) => ({
  darwin: `osascript -e 'tell application "Terminal" to do script "cd ${simulatorLocation} && cp .env.example .env && docker compose build && docker compose up"'`,
  win32: `start cmd.exe /k "cd ${simulatorLocation} && xcopy .env.example .env && docker compose build && docker compose up"`,
  linux: `x-terminal-emulator -e 'bash -c "cd ${simulatorLocation} && cp .env.example .env && docker compose build && docker compose up"'`,
});
export const AVAILABLE_PLATFORMS = ["darwin", "win32", "linux"] as const;
export type RunningPlatform = (typeof AVAILABLE_PLATFORMS)[number];
export const STARTING_TIMEOUT_WAIT_CYLCE = 2000;
