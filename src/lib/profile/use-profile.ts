"use client";

import { useQuery } from "@tanstack/react-query";
import { GATEWAY_URL } from "@/lib/constants";
import type { ProfileMeta } from "./profile";

/**
 * Reads a wallet's on-chain profile via the IQ Gateway, NOT a direct RPC
 * getAccountInfo. The gateway's `/user/{pubkey}/profile` already does the full
 * UserState decode + metadata-txId resolution server-side and returns a
 * ProfileMeta-shaped JSON (plus a `pubkey` field we ignore), so the client
 * needs no account-byte parsing.
 *
 * Why gateway, not RPC: a direct browser → Helius call must pass Helius's
 * per-origin CORS allowlist, which can't cover every origin this app is served
 * from — notably *.sol domains (e.g. zo.sol), which Helius rejects as an
 * "invalid domain format" and so can never be allowlisted. The gateway is
 * open-CORS, so it works from browser.iqlabs.dev and any .sol origin alike.
 *
 * Returns null when the wallet has no profile yet (gateway returns just
 * `{ pubkey }`) — UI shows the empty state instead of spinning forever.
 */
export function useProfile(walletAddress: string | undefined) {
  return useQuery<ProfileMeta | null>({
    queryKey: ["profile", walletAddress],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/user/${walletAddress}/profile`);
      if (!res.ok) return null;
      const data = (await res.json()) as Partial<ProfileMeta> & { pubkey?: string };
      // No `name` → gateway found no profile metadata for this wallet.
      return data.name ? (data as ProfileMeta) : null;
    },
    enabled: !!walletAddress,
    staleTime: 60_000,
    retry: 1,
    retryDelay: 1500,
  });
}
