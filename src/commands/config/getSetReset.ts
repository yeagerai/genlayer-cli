import { ConfigFileManager } from "../../lib/config/ConfigFileManager";
import { BaseAction } from "../../lib/actions/BaseAction";

export class ConfigActions extends BaseAction {
  private configManager: ConfigFileManager;

  constructor() {
    super();
    this.configManager = new ConfigFileManager();
  }

  set(keyValue: string): void {
    const [key, value] = keyValue.split("=");
    this.startSpinner(`Updating configuration: ${key}`);

    if (!key || value === undefined) {
      this.failSpinner("Invalid format. Use 'key=value'.");
      return;
    }

    this.configManager.writeConfig(key, value);
    this.succeedSpinner(`Configuration successfully updated`);
  }

  get(key?: string): void {
    this.startSpinner(key ? `Retrieving value for: ${key}` : "Retrieving all configurations");

    if (key) {
      const value = this.configManager.getConfigByKey(key);
      if (value === null) {
        this.failSpinner(`No configuration found for '${key}'.`);
      } else {
        this.succeedSpinner(`Configuration successfully retrieved`, `${key}=${value}`);
      }
    } else {
      const config = this.configManager.getConfig();
      this.succeedSpinner("All configurations successfully retrieved", JSON.stringify(config, null, 2));
    }
  }

  reset(key: string): void {
    this.startSpinner(`Resetting configuration: ${key}`);

    const config = this.configManager.getConfig();
    if (!(key in config)) {
      this.failSpinner(`Configuration key '${key}' does not exist.`);
      return;
    }

    delete config[key];
    this.configManager.writeConfig(key, undefined);
    this.succeedSpinner(`Configuration successfully reset`);
  }
}
