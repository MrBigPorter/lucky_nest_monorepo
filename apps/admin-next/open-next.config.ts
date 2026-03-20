// open-next.config.ts — used by @opennextjs/cloudflare build process
// See: https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Admin panel does NOT need ISR / incremental caching.
// Using "dummy" implementations keeps the Worker self-contained:
// no R2 bucket, no KV namespace required.
export default defineCloudflareConfig({
  incrementalCache: 'dummy',
  tagCache: 'dummy',
  queue: 'dummy',
});
