import { gwFetch } from "@/lib/gateway/reader";
import type { DbRoot, TableHint } from "./types";

// All DbRoots on iqlabs, with each hint's table PDA pre-derived by the gateway
// (30-min cached there). We just compare strings — no keccak / PDA derivation
// in the browser.
export async function fetchDbRoots(): Promise<DbRoot[]> {
  const res = await gwFetch("/dbroots");
  const data = await res.json();
  return Array.isArray(data.dbroots) ? data.dbroots : [];
}

// Is this pubkey one of the table PDAs in any DbRoot? Returns the owning
// DbRoot + the matching hint so the caller knows which dApp/table it is.
export function matchPubkey(
  pubkey: string,
  dbroots: DbRoot[],
): { dbroot: DbRoot; hint: TableHint } | null {
  for (const dbroot of dbroots) {
    for (const hint of [...dbroot.tableSeeds, ...dbroot.globalTableSeeds]) {
      if (hint.tablePda === pubkey) return { dbroot, hint };
    }
  }
  return null;
}
