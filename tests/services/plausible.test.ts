import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import fs from "fs";
import path from "path";
import { PlausibleService, PlausibleEvent } from "../../src/lib/services/plausible";

vi.mock("axios");
vi.mock("fs");
vi.mock("path");

const MOCK_CONFIG_PATH = "/mock/path/.genlayer-config.json";

describe("PlausibleService", () => {
  let plausibleService: PlausibleService;

  beforeEach(() => {
    vi.resetAllMocks();

    vi.spyOn(path, "resolve").mockReturnValue(MOCK_CONFIG_PATH);

    plausibleService = new PlausibleService();
  });

  describe("trackEvent", () => {
    it("should send a POST request to the API when called", async () => {
      const mockEvent: PlausibleEvent = {
        name: "test-event",
        properties: { key: "value", count: 1 },
      };

      vi.spyOn(axios, "post").mockResolvedValue({}); // Mock axios.post

      await plausibleService.trackEvent(mockEvent);

      expect(axios.post).toHaveBeenCalledWith("https://plausible.io/api/event", {
        name: "test-event",
        url: "/cli-command",
        domain: "studio.genlayer.com",
        props: { key: "value", count: 1 },
      });
    });

    it("should log an error if the API call fails", async () => {
      const mockEvent: PlausibleEvent = {
        name: "test-event",
        properties: { key: "value" },
      };

      const error = new Error("API error");
      vi.spyOn(axios, "post").mockRejectedValue(error); // Mock API error
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await plausibleService.trackEvent(mockEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Plausible] Failed to track event:", error);
    });
  });

  describe("loadConfig", () => {
    it("should return parsed JSON if the config file exists", () => {
      const mockConfig = { telemetryEnabled: true };
      vi.spyOn(fs, "existsSync").mockReturnValue(true); // Mock file existence
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockConfig)); // Mock file content

      const config = plausibleService.loadConfig();

      expect(config).toEqual(mockConfig);
    });

    it("should return an empty object if the config file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);

      const config = plausibleService.loadConfig();

      expect(config).toEqual({});
    });
  });

  describe("saveConfig", () => {
    it("should write the config to the file", () => {
      const mockConfig = { telemetryEnabled: true };
      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      plausibleService.saveConfig(mockConfig);

      expect(writeFileSyncSpy).not.toThrow()
    });

    it("should log an error if writing the file fails", () => {
      const mockConfig = { telemetryEnabled: true };
      const error = new Error("File write error");
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw error;
      });
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      plausibleService.saveConfig(mockConfig);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
});
