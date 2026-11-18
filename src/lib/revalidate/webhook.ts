/**
 * Revalidation webhook verification, exactly as `docs/frontend-revalidation.md` and
 * backend `modules/publishing/webhook.py:verify`: HMAC-SHA256(secret, "<ts>.<raw body>"),
 * header `v1=<hex>`, 300 s tolerance, constant-time compare.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITES_TAG, siteTag } from "@/lib/api/tags";

export const TOLERANCE_SECONDS = 300;

export type VerifyResult = { ok: true } | { ok: false; reason: "stale" | "bad_signature" };

export function sign(secret: string, timestamp: string, body: string): string {
  return "v1=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifySignature(opts: {
  secret: string;
  body: string;
  timestamp: string | null;
  signature: string | null;
  nowSeconds: number;
}): VerifyResult {
  const ts = opts.timestamp ?? "";
  if (!/^\d+$/.test(ts) || Math.abs(opts.nowSeconds - Number(ts)) > TOLERANCE_SECONDS) {
    return { ok: false, reason: "stale" };
  }
  if (!opts.secret) return { ok: false, reason: "bad_signature" };
  const a = Buffer.from(opts.signature ?? "");
  const b = Buffer.from(sign(opts.secret, ts, opts.body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}

export interface PublishJob {
  job_id?: string;
  website_id: string;
  website_key?: string;
  tags: string[];
  full_site: boolean;
}

export function parseJob(body: string): PublishJob | null {
  try {
    const job = JSON.parse(body) as Partial<PublishJob>;
    if (typeof job.website_id !== "string" || !Array.isArray(job.tags)) return null;
    if (!job.tags.every((t) => typeof t === "string" && t.length <= 256)) return null;
    return { ...job, website_id: job.website_id, tags: job.tags, full_site: job.full_site === true };
  } catch {
    return null;
  }
}

/** Tags to revalidate; `full_site` also revalidates `site:{id}`. */
export function tagsToRevalidate(job: PublishJob): string[] {
  return [...new Set(job.full_site ? [siteTag(job.website_id), ...job.tags] : job.tags)];
}

export function touchesHostMap(tags: string[]): boolean {
  return tags.includes(SITES_TAG);
}
