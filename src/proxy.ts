// Keep deployed iqpages sites on our own URL.
//
// Without this, /{ident} (a commit-table PDA or .sol that points at one)
// goes through the client page, which then redirects to /site/{treeTxId}/...
// — the visitor ends up on a different URL. Here we resolve the ident on
// the server and rewrite the request internally, so the address bar stays
// on /{ident} while the proxy route serves the gateway HTML.
//
// Caches: ident → {treeTxId, entry} and treeTxId → manifest (file list +
// indexPath). Module-scope Maps in Edge instance memory; cold instances
// re-fetch, which is fine — the gateway has its own caches behind them.

import { NextRequest, NextResponse } from "next/server";
import { resolveDeployedSite } from "@/lib/iqpages/resolve-site";
import { GATEWAY_URL } from "@/lib/constants";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MANIFEST_TTL_MS = 60 * 60 * 1000;
type Resolved = { treeTxId: string; entry: string } | null;
type Manifest = { indexPath: string; files: Record<string, string> } | null;
type Entry<T> = { value: T; expires: number };

const identCache = new Map<string, Entry<Resolved>>();
const manifestCache = new Map<string, Entry<Manifest>>();

function cachedResolve(ident: string): Promise<Resolved> {
  const hit = identCache.get(ident);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  return resolveDeployedSite(ident).then((res) => {
    identCache.set(ident, { value: res, expires: Date.now() + CACHE_TTL_MS });
    return res;
  });
}

async function cachedManifest(treeTxId: string): Promise<Manifest> {
  const hit = manifestCache.get(treeTxId);
  if (hit && hit.expires > Date.now()) return hit.value;
  let value: Manifest = null;
  try {
    const res = await fetch(`${GATEWAY_URL}/site/${treeTxId}/manifest`);
    if (res.ok) {
      const m = (await res.json()) as { indexPath?: string; files?: Record<string, string> };
      if (m.files) value = { indexPath: m.indexPath ?? "index.html", files: m.files };
    }
  } catch (e) {
    console.warn(`[proxy] manifest fetch failed: ${treeTxId}`, e);
  }
  manifestCache.set(treeTxId, { value, expires: Date.now() + MANIFEST_TTL_MS });
  return value;
}

const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const isIdent = (s: string) => s.toLowerCase().endsWith(".sol") || PUBKEY_RE.test(s);

// Pull an ident out of the Referer header, if it points at /{ident}/... on
// our host. Used to route deployed sites' root-absolute assets (e.g. when
// the HTML has <script src="/src/app.js">) back into /site/{treeTxId}/...
function identFromReferer(req: NextRequest): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  let url: URL;
  try { url = new URL(ref); } catch { return null; }
  if (url.host !== req.nextUrl.host) return null;
  const first = url.pathname.split("/").filter(Boolean)[0];
  return first && isIdent(first) ? first : null;
}

export async function proxy(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return NextResponse.next();
  const [first, ...rest] = parts;

  // Case 1: the first segment is itself an ident — visitor typed /{ident}
  // or /{ident}/{sub-path}. Resolve and rewrite as before.
  if (isIdent(first)) {
    const resolved = await cachedResolve(first);
    if (!resolved) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = `/site/${resolved.treeTxId}/${rest.length ? rest.join("/") : resolved.entry}`;
    // The site route needs to know the ident to inject <base href="/{ident}/">
    // into served HTML, so relative asset URLs in the deployed site resolve
    // back to /{ident}/... (which we proxy) instead of root (which we don't).
    url.searchParams.set("ident", first);
    return NextResponse.rewrite(url);
  }

  // Case 2: not an ident — but deployed sites often ship HTML with
  // root-absolute asset paths (`/assets/style.css`). Use the Referer to
  // figure out which deployed site the asset belongs to. If we can also
  // fetch the manifest, prefer rewriting only for files that actually
  // exist in it (kills false positives from stale referers). If the
  // manifest is unavailable for any reason, rewrite anyway — the site
  // route below will produce a clean 404 for paths that don't exist.
  const ident = identFromReferer(req);
  if (!ident) return NextResponse.next();
  const resolved = await cachedResolve(ident);
  if (!resolved) return NextResponse.next();
  const wanted = parts.join("/");
  const manifest = await cachedManifest(resolved.treeTxId);
  if (manifest && !manifest.files[wanted]) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/site/${resolved.treeTxId}/${wanted}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, the proxy route itself, and the favicon. Everything
  // else is checked by isIdent() above.
  matcher: ["/((?!_next|site|table|favicon|api).*)"],
};
