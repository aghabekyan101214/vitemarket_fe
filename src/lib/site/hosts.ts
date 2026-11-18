/** The process-wide host map, loaded through the configured ApiClient (http or mock). */
import { getEnv } from "@/config/env";
import { getApiClient } from "@/lib/api/client";
import { HostMapCache, sharedHostMapCache } from "./host-map";

export function hostMapCache(): HostMapCache {
  return sharedHostMapCache(
    () => new HostMapCache(() => getApiClient().sites(), getEnv().hostMapTtlSeconds * 1000),
  );
}
