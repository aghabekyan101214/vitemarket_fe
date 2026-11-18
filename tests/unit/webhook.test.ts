import { beforeEach, describe, expect, it, vi } from "vitest";
import { sign, tagsToRevalidate, verifySignature } from "@/lib/revalidate/webhook";

const { revalidateTag, invalidate } = vi.hoisted(() => {
  process.env.REVALIDATE_WEBHOOK_SECRET = "local-webhook-secret";
  process.env.SHOWCASE_API_MODE = "mock";
  return { revalidateTag: vi.fn(), invalidate: vi.fn() };
});
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/lib/site/hosts", () => ({ hostMapCache: () => ({ invalidate }) }));

const { POST } = await import("@/app/api/revalidate/route");

const SECRET = "local-webhook-secret";
const now = () => Math.floor(Date.now() / 1000);
const job = {
  job_id: "j1",
  website_id: "w1",
  website_key: "nordic-home-de",
  tags: ["site:w1:home:de", "site:w1:products:de"],
  paths: ["/"],
  full_site: false,
  content_version: 42,
};

function request(body: string, { ts = String(now()), sig }: { ts?: string; sig?: string } = {}) {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    body,
    headers: { "x-showcase-timestamp": ts, "x-showcase-signature": sig ?? sign(SECRET, ts, body) },
  });
}

describe("verifySignature (backend publishing/webhook.py:verify)", () => {
  const body = JSON.stringify(job);
  it("accepts a valid signature", () => {
    const ts = String(now());
    expect(verifySignature({ secret: SECRET, body, timestamp: ts, signature: sign(SECRET, ts, body), nowSeconds: now() })).toEqual({ ok: true });
  });
  it.each([
    ["stale timestamp", String(now() - 301), "stale"],
    ["future timestamp", String(now() + 301), "stale"],
    ["non-numeric timestamp", "12a", "stale"],
    ["missing timestamp", null, "stale"],
  ])("%s → %s", (_n, ts, reason) => {
    expect(verifySignature({ secret: SECRET, body, timestamp: ts, signature: sign(SECRET, String(ts), body), nowSeconds: now() })).toEqual({ ok: false, reason });
  });
  it("rejects a signature over different bytes or with another secret", () => {
    const ts = String(now());
    expect(verifySignature({ secret: SECRET, body: body + " ", timestamp: ts, signature: sign(SECRET, ts, body), nowSeconds: now() }).ok).toBe(false);
    expect(verifySignature({ secret: SECRET, body, timestamp: ts, signature: sign("other", ts, body), nowSeconds: now() }).ok).toBe(false);
    expect(verifySignature({ secret: SECRET, body, timestamp: ts, signature: "v1=short", nowSeconds: now() }).ok).toBe(false);
  });
  it("full_site adds site:{id}, deduped", () => {
    expect(tagsToRevalidate({ ...job, full_site: true, tags: ["site:w1", "sites"] })).toEqual(["site:w1", "sites"]);
    expect(tagsToRevalidate(job)).toEqual(job.tags);
  });
});

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    invalidate.mockClear();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  it("valid signature → revalidates the expected tags", async () => {
    const res = await POST(request(JSON.stringify(job)));
    expect(res.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([
      ["site:w1:home:de", "max"],
      ["site:w1:products:de", "max"],
    ]);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("full_site → also site:{id}; sites tag → host map invalidated", async () => {
    const res = await POST(request(JSON.stringify({ ...job, full_site: true, tags: ["sites"] })));
    expect(await res.json()).toEqual({ revalidated: 2, tags: ["site:w1", "sites"] });
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it.each<[string, { ts?: string; sig?: string }]>([
    ["bad signature", { sig: "v1=" + "0".repeat(64) }],
    ["stale timestamp", { ts: String(now() - 1000) }],
    ["non-numeric timestamp", { ts: "abc" }],
  ])("%s → 401 and nothing revalidated", async (_n, opts) => {
    const body = JSON.stringify(job);
    const ts = opts.ts ?? String(now());
    const res = await POST(request(body, { ts, sig: opts.sig ?? sign(SECRET, ts, body) }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("signed but malformed payload → 400", async () => {
    expect((await POST(request("{\"tags\": 1}"))).status).toBe(400);
  });
});
