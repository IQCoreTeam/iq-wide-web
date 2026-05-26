// Keep deployed iqpages sites on our own URL.
//
// Without this, /{ident} (a commit-table PDA or .sol that points at one)
// goes through the client page, which then redirects to /site/{treeTxId}/...
// — the visitor ends up on a different URL. Here we resolve the ident on
// the server and rewrite the request internally, so the address bar stays
// on /{ident} while the proxy route serves the gateway HTML.
//
// Cache: ident → treeTxId in a module-scope Map (Edge instance memory).
// First request resolves; same instance's follow-up requests (asset loads
// on the same page) hit the cache. Cold instances re-resolve, which is
// fine — every dependency is the gateway, which caches itself.

import { NextRequest, NextResponse } from "next/server";
import { resolveDeployedSite } from "@/lib/iqpages/resolve-site";

const CACHE_TTL_MS = 5 * 60 * 1000;
type Resolved = { treeTxId: string; entry: string } | null;
type CacheEntry = { value: Resolved; expires: number };
const cache = new Map<string, CacheEntry>();

function cachedResolve(ident: string): Promise<Resolved> {
  const hit = cache.get(ident);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  return resolveDeployedSite(ident).then((res) => {
    cache.set(ident, { value: res, expires: Date.now() + CACHE_TTL_MS });
    return res;
  });
}

const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const isIdent = (s: string) => s.toLowerCase().endsWith(".sol") || PUBKEY_RE.test(s);

export async function proxy(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return NextResponse.next();
  const [ident, ...rest] = parts;
  if (!isIdent(ident)) return NextResponse.next();

  const resolved = await cachedResolve(ident);
  if (!resolved) return NextResponse.next();

  // /{ident}            → /site/{treeTxId}/{entry}    (deploy-time entry, e.g. gameboy.html)
  // /{ident}/{...path}  → /site/{treeTxId}/{...path}  (asset / sub-route as-is)
  const url = req.nextUrl.clone();
  url.pathname = `/site/${resolved.treeTxId}/${rest.length ? rest.join("/") : resolved.entry}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, the proxy route itself, and the favicon. Everything
  // else is checked by isIdent() above.
  matcher: ["/((?!_next|site|table|favicon|api).*)"],
};
