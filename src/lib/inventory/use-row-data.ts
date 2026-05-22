"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTxDataViaGateway } from "@/lib/profile/profile";

/** Lazy body fetch for non-inline inventory entries. Triggered per-card on
 *  user action ("Expand") — stays out of the default feed path so opening
 *  the panel is a single /assets round trip. Payloads are immutable per
 *  signature, so cache forever. */
export function useRowData(signature: string | undefined) {
  return useQuery<Record<string, unknown> | null>({
    queryKey: ["inventory", "row-data", signature],
    queryFn: async () => {
      const raw = await fetchTxDataViaGateway(signature!);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
    enabled: !!signature,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}
