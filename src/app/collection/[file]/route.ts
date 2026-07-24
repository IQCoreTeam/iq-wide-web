// AgentNet collection card image: /collection/{mint}.png renders the umbrella
// art for the skills / workflows Token-2022 groups. The two collection mints
// were created without a MetadataPointer extension, so they can never carry
// on-chain metadata; this route (with the gateway's /collection/{mint} JSON)
// is their official off-chain face instead.
//
// The same path without .png redirects to the gateway JSON, mirroring /skill.
import { renderCollectionCard } from "@/lib/skill-card/collection";

export const runtime = "nodejs";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://gateway.iqlabs.dev";

// AgentNet matched set (must match seed.ts). A tiny closed map: these two
// mints are ecosystem constants, and an unknown mint is a 404, not a render.
const COLLECTIONS: Record<string, "skill" | "workflow"> = {
  BUGHnCh2Pf93tgcxAEfhjd6tUjbY56JrSZdCRXyt7uS5: "skill",
  "6vmWMRWUD34LEjA8eGefegKe5E38WufveMAe2pTm61i8": "workflow",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;
  const wantsImage = file.endsWith(".png");
  const mint = wantsImage ? file.slice(0, -4) : file;
  const type = COLLECTIONS[mint];
  if (!type) return new Response("not found", { status: 404 });

  if (!wantsImage) {
    return Response.redirect(`${GATEWAY_URL}/collection/${mint}`, 307);
  }

  return new Response(new Uint8Array(renderCollectionCard(type, mint)), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
