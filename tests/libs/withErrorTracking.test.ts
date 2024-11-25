import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlausibleService } from "../../src/lib/services/plausible";
import { withErrorTracking, wrapMethodsWithErrorTracking } from "../../src/lib/errors/withErrorTracking";

// Mock the PlausibleService to prevent actual API calls
vi.mock("../../src/lib/services/plausible");

describe("withErrorTracking", () => {
  const plausibleMock = new PlausibleService();
  const trackEvent = vi.mocked(PlausibleService.prototype.trackEvent);

  beforeEach(() => {
    trackEvent.mockResolvedValue();
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it("should execute the function successfully when no error occurs", async () => {
    const mockFn = vi.fn().mockResolvedValue("success");
    const wrappedFn = withErrorTracking(mockFn, "test-event");

    const result = await wrappedFn("arg1", "arg2");

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    expect(plausibleMock.trackEvent).not.toHaveBeenCalled();
  });

  it("should track an error and rethrow it when the function fails", async () => {
    const error = new Error("Test error");
    const mockFn = vi.fn().mockRejectedValue(error);
    const wrappedFn = withErrorTracking(mockFn, "test-event");

    await expect(wrappedFn("arg1")).rejects.toThrow("Test error");

    expect(mockFn).toHaveBeenCalledWith("arg1");
    expect(PlausibleService.prototype.trackEvent).toHaveBeenCalledWith({
      name: "test-event-error",
      properties: {
        message: "Test error",
        stack: error.stack || "No stack trace",
      },
    });
  });

  it("should log an error if telemetry fails", async () => {
    const error = new Error("Test error");
    const telemetryError = new Error("Telemetry failure");
    const mockFn = vi.fn().mockRejectedValue(error);
    const wrappedFn = withErrorTracking(mockFn, "test-event");

    // Mock telemetry failure
    trackEvent.mockRejectedValueOnce(telemetryError);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(wrappedFn()).rejects.toThrow("Test error");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to send telemetry:", telemetryError);
  });
});

describe("wrapMethodsWithErrorTracking", () => {
 const trackEvent = vi.mocked(PlausibleService.prototype.trackEvent);

  class TestClass {
    async method1(arg: string): Promise<string> {
      if (arg === "fail") {
        throw new Error("Method1 failed");
      }
      return `Method1: ${arg}`;
    }

    async method2(): Promise<string> {
      return "Method2 success";
    }
  }

  beforeEach(() => {
    trackEvent.mockResolvedValue();
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it("should wrap specified methods with error tracking", async () => {
    const instance = new TestClass();
    wrapMethodsWithErrorTracking(instance, ["method1", "method2"]);

    await expect(instance.method1("fail")).rejects.toThrow("Method1 failed");

    const result = await instance.method2();
    expect(result).toBe("Method2 success");

  });

  it("should only wrap methods specified in the list", async () => {
    const instance = new TestClass();
    wrapMethodsWithErrorTracking(instance, ["method1"]); // Only wrap method1

    const telemetrySpy = vi.spyOn(PlausibleService.prototype, "trackEvent");

    await expect(instance.method1("fail")).rejects.toThrow("Method1 failed");

    const result = await instance.method2();
    expect(result).toBe("Method2 success");
    expect(telemetrySpy).not.toHaveBeenCalledWith({
      name: "method2-error",
    });
  });
});
