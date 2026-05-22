"use client";

import { useMemo } from "react";
import {
  classifyEntry,
  isInline,
  parseInlineRow,
  type InventoryEntry,
} from "@/lib/inventory/inventory";
import { useUserInventory } from "@/lib/inventory/use-user-inventory";

/** Row stored by `GitClient.createRepo` (v2: `git_repos_v2_<owner>`).
 *  v2 row schema is `{name, description, isPublic, timestamp}` — owner is
 *  implicit (the table is owner-scoped, and we already know walletAddress). */
export interface IqgitRepoEntry {
  signature: string;
  blockTime: number | null;
  name: string;
  description: string;
  owner: string;
  isPublic: boolean;
  timestamp: number;
}

function pickRow(entry: InventoryEntry): Record<string, unknown> | null {
  if (entry.row) return entry.row;
  if (isInline(entry)) return parseInlineRow(entry);
  return null;
}

function toRepoEntry(entry: InventoryEntry, walletAddress: string): IqgitRepoEntry | null {
  if (classifyEntry(entry) !== "iqgit-repo") return null;
  const row = pickRow(entry);
  if (!row || typeof row.name !== "string") return null;
  return {
    signature: entry.signature,
    blockTime: entry.blockTime,
    name: row.name,
    description: typeof row.description === "string" ? row.description : "",
    // v2 row has no owner field; v1 might. Prefer the row's value when
    // present so legacy rows still display correctly.
    owner: typeof row.owner === "string" ? row.owner : walletAddress,
    isPublic: Boolean(row.isPublic),
    timestamp: typeof row.timestamp === "number" ? row.timestamp : 0,
  };
}

/** Inventory-derived repo list for a wallet. Dedupes by name (keeps first,
 *  which is newest since inventory is newest-first). */
export function useUserRepos(walletAddress: string | undefined) {
  const { data, ...rest } = useUserInventory(walletAddress);
  const repos = useMemo<IqgitRepoEntry[]>(() => {
    if (!data || !walletAddress) return [];
    const seen = new Set<string>();
    const out: IqgitRepoEntry[] = [];
    for (const entry of data) {
      const repo = toRepoEntry(entry, walletAddress);
      if (!repo) continue;
      if (seen.has(repo.name)) continue;
      seen.add(repo.name);
      out.push(repo);
    }
    return out;
  }, [data, walletAddress]);
  return { ...rest, data: repos };
}
