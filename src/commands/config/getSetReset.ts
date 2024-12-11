import { ConfigFileManager } from "../../lib/config/ConfigFileManager";

export class ConfigActions {
  private configManager: ConfigFileManager;

  constructor() {
    this.configManager = new ConfigFileManager();
  }

  set(keyValue: string): void {
    const [key, value] = keyValue.split("=");
    if (!key || value === undefined) {
      console.error("Invalid format. Use key=value.");
      process.exit(1);
    }
    this.configManager.writeConfig(key, value);
    console.log(`Configuration updated: ${key}=${value}`);
  }

  get(key?: string): void {
    if (key) {
      const value = this.configManager.getConfigByKey(key);
      if (value === null) {
        console.log(`No value set for key: ${key}`);
      } else {
        console.log(`${key}=${value}`);
      }
    } else {
      const config = this.configManager.getConfig();
      console.log("Current configuration:", JSON.stringify(config, null, 2));
    }
  }

  reset(key: string): void {
    const config = this.configManager.getConfig();
    if (config[key] === undefined) {
      console.log(`Key does not exist in the configuration: ${key}`);
      return;
    }
    delete config[key];
    this.configManager.writeConfig(key, undefined);
    console.log(`Configuration key reset: ${key}`);
  }
}
