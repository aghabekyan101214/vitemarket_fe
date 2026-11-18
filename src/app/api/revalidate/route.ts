/**
 * Signed revalidation webhook from the backend publish worker
 * (docs/frontend-revalidation.md). Responds 2xx only after revalidating; anything else is
 * retried by the backend with backoff.
 */
import { revalidateTag } from "next/cache";
import { getEnv } from "@/config/env";
import { parseJob, tagsToRevalidate, touchesHostMap, verifySignature } from "@/lib/revalidate/webhook";
import { hostMapCache } from "@/lib/site/hosts";

export const dynamic = "force-dynamic";

/**
 * 'max' = stale-while-revalidate: the next request still gets the old page once and
 * triggers regeneration. Use `{ expire: 0 }` if editors must see changes on the very next
 * request (costs a blocking render for that visitor).
 */
const PROFILE = "max";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text(); // raw body: the signature covers exactly these bytes
  const verified = verifySignature({
    secret: getEnv().webhookSecret,
    body,
    timestamp: req.headers.get("x-showcase-timestamp"),
    signature: req.headers.get("x-showcase-signature"),
    nowSeconds: Date.now() / 1000,
  });
  if (!verified.ok) {
    return new Response(verified.reason === "stale" ? "stale" : "bad signature", { status: 401 });
  }

  const job = parseJob(body);
  if (!job) return new Response("invalid payload", { status: 400 });

  const tags = tagsToRevalidate(job);
  for (const tag of tags) revalidateTag(tag, PROFILE);
  if (touchesHostMap(tags)) hostMapCache().invalidate();

  console.info("[revalidate]", { job: job.job_id, site: job.website_key, tags: tags.length });
  return Response.json({ revalidated: tags.length, tags });
}
