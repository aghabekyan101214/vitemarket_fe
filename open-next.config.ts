import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

// Bindings are declared in wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
});
