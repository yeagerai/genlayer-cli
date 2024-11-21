import axios from "axios";

export interface PlausibleEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
}

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
}
