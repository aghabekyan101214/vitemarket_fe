/**
 * Host → site → rewrite. Runs before every request except Next internals, the revalidate
 * webhook and mock media. All decisions live in `lib/site/resolve-request.ts` (tested).
 */
import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/config/env";
import { HostMapUnavailable } from "@/lib/site/host-map";
import { hostMapCache } from "@/lib/site/hosts";
import { resolveRequest } from "@/lib/site/resolve-request";

const NOINDEX = "noindex, nofollow";

function incomingHost(request: NextRequest, trustForwarded: boolean): string | null {
  if (trustForwarded) {
    const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return request.headers.get("host");
}

function plain(status: number, body: string, headers: Record<string, string> = {}): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": NOINDEX, ...headers },
  });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const env = getEnv();

  let map;
  try {
    map = await hostMapCache().get();
  } catch (err) {
    if (err instanceof HostMapUnavailable) {
      console.error("[proxy] no host map available", { error: err.message });
      return plain(503, "Service unavailable", { "retry-after": "30" });
    }
    throw err;
  }

  const decision = resolveRequest(
    {
      host: incomingHost(request, env.trustForwardedHost),
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
    },
    map,
    env.devHostAliases,
  );

  let response: NextResponse;
  switch (decision.type) {
    case "not_found":
      return plain(404, "Not found");
    case "redirect": {
      // Internal redirects keep the host the visitor used (nextUrl carries the Host header).
      const location = decision.external ? decision.location : new URL(decision.location, request.nextUrl.origin);
      response = NextResponse.redirect(location, 308);
      break;
    }
    case "rewrite": {
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      const headers = new Headers(request.headers);
      headers.set("x-site-host", decision.entry.hostname);
      headers.set("x-site-key", decision.entry.site.key);
      response = NextResponse.rewrite(url, { request: { headers }, status: decision.status });
      break;
    }
  }
  if (!env.isProduction) response.headers.set("x-robots-tag", NOINDEX);
  return response;
}

export const config = {
  matcher: ["/((?!_next/|__nextjs|api/revalidate|mock-media/).*)"],
};
