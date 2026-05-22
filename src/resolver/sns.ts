import { gwFetch } from "@/lib/gateway/reader";

// Resolve a .sol domain via the gateway: { owner, record }. record is the
// SOL-record pointer (a wallet or PDA the owner set), owner is the registry
// owner to fall back on. The caller picks which to dispatch on.
export async function fetchSnsResolution(
  domain: string,
): Promise<{ owner: string | null; record: string | null }> {
  const res = await gwFetch(`/sns/${domain}`);
  const data = await res.json();
  return { owner: data.owner ?? null, record: data.record ?? null };
}
