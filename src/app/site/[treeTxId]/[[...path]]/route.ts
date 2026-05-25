// Proxy iqpages-deployed git sites under our own host. The route is a
// catch-all: HTML, CSS, JS, images, anything the page requests under
// /site/{treeTxId}/... funnels through here and we replay the gateway's
// /site/{treeTxId}/... response. Because the page sees itself at that path
// on OUR host, its own relative URLs (./style.css, /logo.png) resolve back
// to us and we proxy them too — no <base href> trickery, no surprise effect
// on ES module imports or import.meta.url.

import { NextResponse } from "next/server";
import { GATEWAY_URL } from "@/lib/constants";

interface Params {
  treeTxId: string;
  path?: string[];
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { treeTxId, path } = await ctx.params;
  const tail = (path ?? []).join("/");
  const upstreamUrl = tail
    ? `${GATEWAY_URL}/site/${treeTxId}/${tail}`
    : `${GATEWAY_URL}/site/${treeTxId}`;
  const upstream = await fetch(upstreamUrl);

  if (!upstream.ok) {
    return new NextResponse(`gateway said ${upstream.status}`, { status: upstream.status });
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/octet-stream" },
  });
}
