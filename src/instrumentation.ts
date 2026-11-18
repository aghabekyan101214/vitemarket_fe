/** Fail fast on invalid configuration at server start. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("./config/env");
    getEnv();
  }
}
