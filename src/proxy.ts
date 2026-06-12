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
import { recordTarget } from "@/resolver/shape";
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

// Hosts that ARE us — never treat these as a "wrapping" SNS domain. A request
// whose Host is our own app (or local dev) is served normally; only a foreign
// domain that CNAME'd into us gets the host-routing treatment below.
const OWN_HOSTS = new Set(["browser.iqlabs.dev", "localhost", "127.0.0.1"]);

// Turn a wrapping Host (e.g. "zo-iq.sol.site") into the SNS name to look up
// ("zo-iq"). Returns null when the Host is one of ours or has no usable name.
// Mirrors the gateway's host-routing: it strips a known public suffix and uses
// the leading label as the .sol name. We accept ".sol.site" (sol.site infra)
// and a bare ".sol" Host, which is all the gateway resolves today.
function snsNameFromHost(host: string): string | null {
  const h = host.toLowerCase().split(":")[0];
  if (!h || OWN_HOSTS.has(h)) return null;
  for (const suffix of [".sol.site", ".sol"]) {
    if (h.endsWith(suffix)) {
      const name = h.slice(0, -suffix.length);
      return name && !name.includes(".") ? name : null;
    }
  }
  return null;
}

// Read the wrapping domain's raw URL record via the gateway. The owner puts the
// link they want here (e.g. "browser.iqlabs.dev/<pda>" or
// "gateway.iqlabs.dev/site/<sig>/<file>"); we interpret whatever shape it is.
// Edge-safe: fetch + JSON only.
async function fetchPointer(name: string): Promise<string | null> {
  try {
    // The gateway's /pointer is the host-routing target: the SOL record (a bare
    // pubkey/PDA) if set, else the TXT record. CNAME and URL are not consulted.
    const res = await fetch(`${GATEWAY_URL}/sns/${name}/pointer`);
    if (!res.ok) return null;
    const data = (await res.json()) as { pointer?: string | null };
    return data.pointer ?? null;
  } catch (e) {
    console.warn(`[proxy] sns pointer fetch failed: ${name}`, e);
    return null;
  }
}

const SITE_URL_RE = /\/site\/([1-9A-HJ-NP-Za-km-z]{86,90})\/?(.*)$/;

const TX_SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{86,90}$/;

// Interpret a raw URL record into how we should serve it. The owner can store
// any of these shapes — we accept them all:
//  - "gateway.iqlabs.dev/site/<sig>/<file>"  → serve that manifest directly
//  - a bare 86–90 char tx signature          → serve /site/<sig> directly
//  - "browser.iqlabs.dev/<pda>" or a bare <pda> → reduce to an ident (the last
//    path segment) and run it through the dispatcher (repo/wallet/site view).
function interpretPointer(
  url: string,
): { kind: "site"; sig: string; entry: string } | { kind: "ident"; ident: string } {
  // Full /site/<sig>/<file> URL → sig + entry path.
  const m = url.match(SITE_URL_RE);
  if (m) return { kind: "site", sig: m[1], entry: m[2] || "" };
  // Strip any host/scheme prefix down to the last segment, then classify by
  // shape: a tx signature serves a manifest; anything shorter is an ident.
  const target = recordTarget(url);
  if (TX_SIG_RE.test(target)) return { kind: "site", sig: target, entry: "" };
  return { kind: "ident", ident: target };
}

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
  // Host-routing: if a foreign domain CNAME'd into us, the request arrives with
  // that domain in the Host header (e.g. "zo-iq.sol.site"). Read the wrapping
  // domain's URL record and serve whatever the owner pointed it at — at the
  // wrapping URL, address bar unchanged.
  const wrapName = snsNameFromHost(req.headers.get("host") ?? "");
  if (wrapName) {
    const pointer = await fetchPointer(wrapName);
    if (pointer) {
      const reqPath = req.nextUrl.pathname;
      const subPath = reqPath === "/" || reqPath === "" ? "" : reqPath.replace(/^\//, "");
      const record = interpretPointer(pointer);

      // Under host-routing the site lives at the host root, so its own
      // root-relative/relative asset URLs resolve correctly as-is — and every
      // asset request re-enters here via the same Host header and gets routed
      // again. So we must NOT inject <base href="/{ident}/"> (that's only for
      // path-based /{ident} access); doing so would make the browser fetch
      // /{ident}/styles.css, which isn't the asset. Hence no x-iqpages-ident.

      // "/site/<sig>" URL → serve that manifest directly (nubs model).
      if (record.kind === "site") {
        const tail = subPath || record.entry;
        const dest = req.nextUrl.clone();
        dest.pathname = `/site/${record.sig}/${tail}`;
        return NextResponse.rewrite(dest);
      }

      // Otherwise the record reduced to an ident (e.g. a deployed-site PDA).
      // Run it through the same pipeline as /{ident}: a deployed site is
      // rewritten into the proxy route; anything else falls through so the
      // client app renders the matching (repo/wallet/...) view.
      const resolved = await cachedResolve(record.ident);
      if (resolved) {
        const tail = subPath || resolved.entry;
        const dest = req.nextUrl.clone();
        dest.pathname = `/site/${resolved.treeTxId}/${tail}`;
        return NextResponse.rewrite(dest);
      }
    }
    // No URL record (or unresolved) → fall through to the client app.
  }

  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return NextResponse.next();
  const [first, ...rest] = parts;

  // Case 1: the first segment is itself an ident — visitor typed /{ident}
  // or /{ident}/{sub-path}. Resolve and rewrite as before.
  if (isIdent(first)) {
    const resolved = await cachedResolve(first);
    if (!resolved) return NextResponse.next();

    // The site route needs to know the ident so it can inject
    // <base href="/{ident}/"> into served HTML. Pass it as a request header
    // (rewrite() drops the destination URL's query string in Edge runtime).
    const tail = rest.length ? rest.join("/") : resolved.entry;
    const dest = req.nextUrl.clone();
    dest.pathname = `/site/${resolved.treeTxId}/${tail}`;
    const headers = new Headers(req.headers);
    headers.set("x-iqpages-ident", first);
    return NextResponse.rewrite(dest, { request: { headers } });
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
