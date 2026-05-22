"use client";

// Single fetch that backs every tab in the right-side panel. Goes through
// the gateway's `/user/<pubkey>/assets` endpoint (one HTTP call), with the
// SDK's `fetchInventoryTransactions` as a fallback when gateways are down
// (one RPC per tx — slow, but correct).

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryGW } from "@/lib/gateway/reader";
import type { InventoryEntry } from "./inventory";

const DEFAULT_LIMIT = 100;

export function useUserInventory(walletAddress: string | undefined, limit = DEFAULT_LIMIT) {
  return useQuery<InventoryEntry[]>({
    queryKey: ["inventory", walletAddress, limit],
    queryFn: () => fetchInventoryGW(walletAddress!, limit),
    enabled: !!walletAddress,
    staleTime: 60_000,
  });
}
