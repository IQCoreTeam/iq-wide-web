"use client";

import { useMemo } from "react";
import { IQCHAN_URL } from "@/lib/constants";
import {
  classifyEntry,
  isInline,
  parseInlineRow,
  type InventoryEntry,
} from "@/lib/inventory/inventory";
import { useUserInventory } from "@/lib/inventory/use-user-inventory";

/** Row shape matches iqchan/src/hooks/use-post.ts.
 *  `sub` is the thread title on OP rows; empty on replies.
 *  `com` is the post body on both OP and reply. */
export interface IqchanPostEntry {
  signature: string;
  blockTime: number | null;
  /** False means the body sits behind a linked list / session — the card
   *  shows a "Long post — open on BlockChan" link instead of expanding
   *  inline. iqprofilenet doesn't fetch the body itself. */
  inline: boolean;
  name?: string;
  sub?: string;
  com?: string;
  img?: string;
  threadPda?: string;
  threadSeed?: string;
  /** True when this row is the thread's OP — iqchan writes OP with `sub`
   *  set and replies omit the key entirely. */
  isOp: boolean;
}

function pickRow(entry: InventoryEntry): Record<string, unknown> | null {
  // Prefer the gateway-supplied row (works for non-inline too); fall back
  // to the inline payload when the gateway prefix isn't there.
  if (entry.row) return entry.row;
  if (isInline(entry)) return parseInlineRow(entry);
  return null;
}

function toPostEntry(entry: InventoryEntry): IqchanPostEntry | null {
  if (classifyEntry(entry) !== "iqchan-post") return null;

  const row = pickRow(entry);
  // Without a row body we can still surface a stub — the filename tag was
  // enough to confirm "this is an iqchan post". Body lives on BlockChan.
  if (!row) {
    return {
      signature: entry.signature,
      blockTime: entry.blockTime,
      inline: false,
      isOp: false,
    };
  }

  // OP rows include a `sub` key (iqchan writes `sub: ""` when the user
  // omits the title). Reply rows omit the key entirely.
  const rawSub = row.sub;
  const isOp = "sub" in row && typeof rawSub === "string";
  return {
    signature: entry.signature,
    blockTime: entry.blockTime,
    inline: true,
    name: row.name as string | undefined,
    sub: rawSub as string | undefined,
    com: row.com as string | undefined,
    img: row.img as string | undefined,
    threadPda: row.threadPda as string | undefined,
    threadSeed: row.threadSeed as string | undefined,
    isOp,
  };
}

/** Inventory-derived post list for a wallet. Non-inline rows still surface
 *  as stubs (with a "Long post — open on BlockChan" link) when their body
 *  is too big to ride in the inventory feed. */
export function useUserPosts(walletAddress: string | undefined) {
  const { data, ...rest } = useUserInventory(walletAddress);
  const posts = useMemo<IqchanPostEntry[]>(
    () => (data ?? [])
      .map(toPostEntry)
      .filter((v): v is IqchanPostEntry => v !== null),
    [data],
  );
  return { ...rest, data: posts };
}

/** Deep-link into BlockChan's hash router.
 *
 *  Post URL shape (from iqchan src/components/post.tsx):
 *    `${IQCHAN_URL}/#/{boardId}/{threadPda}:p{signature}`
 *
 *  boardId is the first segment of threadSeed (iqchan seeds threads as
 *  `{boardId}/thread/{uuid}` — see iqchan src/lib/constants.ts:59-60).
 *  Falls back to the homepage when we lack threadPda/threadSeed/signature
 *  (non-inline stub rows until body is fetched). */
export function buildIqchanPostUrl(
  post?: Pick<IqchanPostEntry, "threadSeed" | "threadPda" | "signature">,
): string {
  if (post?.threadSeed && post?.threadPda && post?.signature) {
    const boardId = post.threadSeed.split("/")[0];
    if (boardId) {
      return `${IQCHAN_URL}/#/${boardId}/${post.threadPda}:p${post.signature}`;
    }
  }
  return IQCHAN_URL;
}
