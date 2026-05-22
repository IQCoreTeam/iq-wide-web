"use client";

import { useQuery } from "@tanstack/react-query";
import { shapeOf } from "./shape";
import { fetchDbRoots, matchPubkey } from "./dbroots";
import { fetchSnsResolution } from "./sns";
import type { IdentifierKind } from "./types";

// Classify a pubkey: a known dApp table PDA, otherwise a wallet. We don't gate
// on profile existence — a wallet with assets/posts but no profile record
// still gets the wallet view (ProfilePanel renders its own empty state).
async function resolvePubkey(pubkey: string): Promise<IdentifierKind> {
  const match = matchPubkey(pubkey, await fetchDbRoots());
  if (match) return { kind: "dbroot-table", pubkey, dbroot: match.dbroot, hint: match.hint };
  return { kind: "wallet", pubkey };
}

async function resolve(ident: string): Promise<IdentifierKind> {
  switch (shapeOf(ident)) {
    case "pubkey":
      return resolvePubkey(ident);
    case "sig":
      return { kind: "tx", signature: ident };
    case "sol": {
      // A .sol points at a pubkey: the SOL record if the owner set one (lets a
      // domain target any wallet/PDA), otherwise the domain owner itself ("the
      // domain just is that wallet"). Then resolve that pubkey like any other.
      const { owner, record } = await fetchSnsResolution(ident);
      const target = record ?? owner;
      return target ? resolvePubkey(target) : { kind: "not-found", ident };
    }
    default:
      return { kind: "not-found", ident };
  }
}

export function useResolve(ident: string) {
  return useQuery<IdentifierKind>({
    queryKey: ["resolve", ident],
    queryFn: () => resolve(ident),
    staleTime: 30 * 60 * 1000, // matches the gateway /dbroots cache window
    retry: 1,
  });
}
