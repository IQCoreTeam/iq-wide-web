// Proxy iqpages-deployed git sites under our own host. The route is a
// catch-all: HTML, CSS, JS, images, anything the page requests under
// /site/{treeTxId}/... funnels through here and we replay the gateway's
// /site/{treeTxId}/... response. Because the page sees itself at that path
// on OUR host, its own relative URLs (./style.css, /logo.png) resolve back
// to us and we proxy them too.
//
// HTML special case: the proxy.ts middleware passes ?ident=... when it
// rewrites /{ident} → here. We inject <base href="/{ident}/"> into the
// served HTML so relative links like <link href="assets/style.css"> resolve
// to /{ident}/assets/style.css (which the middleware proxies back here)
// instead of /assets/style.css (which 404s on our host).

import { NextResponse } from "next/server";
import { GATEWAY_URL } from "@/lib/constants";

interface Params {
  treeTxId: string;
  path?: string[];
}

function injectBase(html: string, ident: string): string {
  const baseTag = `<base href="/${ident}/">`;
  // Most deployed iqpages sites have a plain <head>...</head>. Insert <base>
  // as the first child so it takes effect before any other URL in <head>
  // (favicon, stylesheet, script) is resolved.
  if (html.includes("<head>")) return html.replace("<head>", `<head>${baseTag}`);
  if (html.includes("<head ")) return html.replace(/<head\b[^>]*>/, (m) => `${m}${baseTag}`);
  return `${baseTag}${html}`;
}

// Upstream headers worth replaying to the client. Range/caching/validation
// headers must survive the proxy hop — without them iOS Safari refuses to play
// <video>/<audio> (it needs 206 + Accept-Ranges/Content-Range to stream media).
const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-range",
  "accept-ranges",
  "content-length",
  "cache-control",
  "etag",
  "last-modified",
];

function replayHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }
  return headers;
}

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const { treeTxId, path } = await ctx.params;
  const tail = (path ?? []).join("/");
  const upstreamUrl = tail
    ? `${GATEWAY_URL}/site/${treeTxId}/${tail}`
    : `${GATEWAY_URL}/site/${treeTxId}`;

  // Forward the client's Range (and validators) so the gateway can answer with
  // a 206 partial response instead of a full 200 the browser then rejects.
  const fwd = new Headers();
  for (const name of ["range", "if-none-match", "if-range"]) {
    const v = req.headers.get(name);
    if (v) fwd.set(name, v);
  }
  const upstream = await fetch(upstreamUrl, { headers: fwd });

  if (upstream.status >= 400) {
    return new NextResponse(`gateway said ${upstream.status}`, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  // proxy.ts sets x-iqpages-ident on the request when it rewrites /{ident}
  // → /site/.... Query strings get dropped across Next's rewrite boundary,
  // so we use a header instead.
  const ident = req.headers.get("x-iqpages-ident");

  if (ident && contentType.startsWith("text/html")) {
    const html = await upstream.text();
    return new NextResponse(injectBase(html, ident), {
      status: 200,
      headers: { "content-type": contentType },
    });
  }

  // Replay the gateway's status (200/206/304) and media headers verbatim.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: replayHeaders(upstream),
  });
}
