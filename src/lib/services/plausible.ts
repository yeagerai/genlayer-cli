import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

export interface PlausibleEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
}

const CONFIG_FILE_PATH = path.resolve(os.homedir(), ".genlayer-config.json");

export class PlausibleService {
  private apiUrl: string;
  private siteId: string;

  constructor(siteId = 'studio.genlayer.com', apiUrl = "https://plausible.io/api/event") {
    this.siteId = siteId;
    this.apiUrl = apiUrl;
  }

  async trackEvent(event: PlausibleEvent): Promise<void> {
    try {
      await axios.post(this.apiUrl, {
        name: event.name,
        url: "/cli-command",
        domain: this.siteId,
        props: event.properties,
      });
      console.log(`[Plausible] Event tracked: ${event.name}`);
    } catch (error) {
      console.error("[Plausible] Failed to track event:", error);
    }
  }

  loadConfig(): Record<string, any> {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf8"));
    }
    return {};
  }

  saveConfig(config: Record<string, any>): void {
    try{
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf8");
    }catch(error){
      console.log(error);
    }
  }
}
