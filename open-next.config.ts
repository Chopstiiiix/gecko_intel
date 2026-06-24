import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext → Cloudflare Workers adapter config for Gecko.
 *
 * Default (in-memory / no incremental cache) is fine: Gecko's dynamic data
 * comes from API routes (Nigeria KV store + live external feeds), not from
 * Next.js ISR. If page-level caching is added later, wire an R2/KV incremental
 * cache here.
 */
export default defineCloudflareConfig({});
