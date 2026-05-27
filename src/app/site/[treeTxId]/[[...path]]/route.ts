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

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const { treeTxId, path } = await ctx.params;
  const tail = (path ?? []).join("/");
  const upstreamUrl = tail
    ? `${GATEWAY_URL}/site/${treeTxId}/${tail}`
    : `${GATEWAY_URL}/site/${treeTxId}`;
  const upstream = await fetch(upstreamUrl);

  if (!upstream.ok) {
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

  return new NextResponse(upstream.body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
