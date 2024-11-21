import { PlausibleService } from "../../lib/services/plausible";

const plausible = new PlausibleService();

export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  eventName: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error:any) {
      console.error(`[Error - ${eventName}]:`, error?.message || error);
      try {
        await plausible.trackEvent({
          name: `${eventName}-error`,
          properties: {
            message: error?.message || "Unknown error",
            stack: error?.stack || "No stack trace",
          },
        });
      } catch (telemetryError) {
        console.error("Failed to send telemetry:", telemetryError);
      }
      throw error;
    }
  }) as T;
}

export function wrapMethodsWithErrorTracking<T>(
  instance: T,
  methodsToTrack: Array<keyof T>
): void {
  for (const methodName of methodsToTrack) {
    const originalMethod = instance[methodName] as (...args: any[]) => Promise<any>;
    if (typeof originalMethod === "function") {
      instance[methodName] = withErrorTracking(
        originalMethod.bind(instance),
        methodName as string
      ) as any;
    }
  }
}

