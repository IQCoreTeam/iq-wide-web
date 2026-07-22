// AgentNet skill card image: /skill/{mint}/{sig}.png renders the 1024x1024
// terminal card for a skill/workflow NFT. This is the RENDER layer's half of
// the split: the gateway (cache layer) assembles the item's data from chain
// at /skill/{mint}/{sig}, and this route turns that one JSON into pixels.
// No chain code here on purpose.
//
// The same path without .png is reserved for the human-facing skill page;
// until that exists it redirects to the gateway JSON.
import { renderCard, type CardData } from "@/lib/skill-card/card";

export const runtime = "nodejs";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://gateway.iqlabs.dev";

const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

interface GatewaySkillJson {
  name?: string;
  description?: string;
  attributes?: { trait_type: string; value: string }[];
  creator?: string | null;
  priceLamports?: string | null;
  itemType?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string; file: string }> },
): Promise<Response> {
  const { mint, file } = await params;
  const wantsImage = file.endsWith(".png");
  const sig = wantsImage ? file.slice(0, -4) : file;
  if (!PUBKEY_RE.test(mint) || !SIG_RE.test(sig)) {
    return Response.json({ error: "expected /skill/{mint}/{inscription-sig}[.png]" }, { status: 400 });
  }

  // Reserved for the future skill detail page: hand humans the data for now.
  if (!wantsImage) {
    return Response.redirect(`${GATEWAY_URL}/skill/${mint}/${sig}`, 307);
  }

  const res = await fetch(`${GATEWAY_URL}/skill/${mint}/${sig}`, { next: { revalidate: 3600 } });
  if (!res.ok) return new Response("not found", { status: 404 });
  const json = (await res.json()) as GatewaySkillJson;
  if (!json.name) return new Response("not found", { status: 404 });

  const attrs = Array.isArray(json.attributes) ? json.attributes : [];
  const data: CardData = {
    name: json.name,
    type: json.itemType === "workflow" ? "workflow" : "skill",
    category: attrs.find((t) => t.trait_type === "category")?.value,
    hashtags: attrs.filter((t) => t.trait_type === "skill").map((t) => t.value),
    description: json.description ?? "",
    creator: json.creator ?? null,
    priceLamports: json.priceLamports ?? null,
  };

  return new Response(new Uint8Array(renderCard(data)), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
