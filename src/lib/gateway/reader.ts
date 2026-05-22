// Gateway-first reader/notifier for iqprofilenet. Same shape as
// solchat-web/lib/gateway/reader.ts; on top of table reads and code-in
// reads, we also surface the user-asset feed (the right panel's main
// data source) which used to fan out to ~100 RPCs via the SDK.

import { PublicKey } from "@solana/web3.js";
import iqlabs from "iqlabs-sdk";

const PRIMARY_GATEWAY = "https://gateway.solanainternet.com";
const BACKUP_GATEWAY = "https://gateway.iqlabs.dev";
const GATEWAYS = [PRIMARY_GATEWAY, BACKUP_GATEWAY];
const GATEWAY_OVERRIDE_KEY = "iqprofilenet_gateway";

function getGateways(): string[] {
  if (typeof window !== "undefined") {
    const custom = window.localStorage.getItem(GATEWAY_OVERRIDE_KEY);
    if (custom) return [custom, ...GATEWAYS];
  }
  return GATEWAYS;
}

export async function gwFetch(path: string): Promise<Response> {
  for (const gw of getGateways()) {
    try {
      const res = await fetch(`${gw}${path}`);
      if (res.ok) return res;
    } catch {
      continue;
    }
  }
  throw new Error("all gateways unreachable");
}

// ---------------------------------------------------------------
// Inventory feed — replaces SDK fetchInventoryTransactions
// (the per-tx RPC blowup). Gateway returns ~100 in one HTTP.
// ---------------------------------------------------------------

export interface InventoryEntry {
  signature: string;
  slot: number;
  blockTime: number | null;
  onChainPath: string;
  metadata: string;
  /** Row body prefix when the gateway has it cached — lets us classify
   *  non-inline entries without a body fetch. Optional because legacy
   *  responses may omit it. */
  row?: Record<string, unknown>;
}

export async function fetchInventoryGW(
  pubkey: string,
  limit = 100,
): Promise<InventoryEntry[]> {
  try {
    const res = await gwFetch(`/user/${pubkey}/assets?limit=${limit}`);
    const data = await res.json();
    const assets = Array.isArray(data) ? data : data.assets ?? [];
    return assets.map((a: Record<string, unknown>) => ({
      signature: String(a.signature ?? ""),
      slot: typeof a.slot === "number" ? a.slot : 0,
      blockTime: typeof a.blockTime === "number" ? a.blockTime : null,
      onChainPath: typeof a.onChainPath === "string" ? a.onChainPath : "",
      metadata: typeof a.metadata === "string" ? a.metadata : "",
      row: typeof a.row === "object" && a.row !== null ? (a.row as Record<string, unknown>) : undefined,
    }));
  } catch (e) {
    console.warn("[gateway] inventory fallback to RPC", e);
    const rows = await iqlabs.reader.fetchInventoryTransactions(new PublicKey(pubkey), limit);
    return rows.map((r) => ({
      signature: r.signature,
      slot: r.slot,
      blockTime: r.blockTime ?? null,
      onChainPath: r.onChainPath,
      metadata: r.metadata,
    }));
  }
}

// ---------------------------------------------------------------
// Git-aware shortcuts (mirror what `lib/gateway/reader.ts` in
// on-chaingit-frontend exposes — same hint scheme).
// ---------------------------------------------------------------

const COMMIT_HINT = (owner: string, repo: string) => `git_commits:${owner}:${repo}`;
const PROGRAM_ID = new PublicKey(iqlabs.contract.DEFAULT_ANCHOR_PROGRAM_ID);
const DB_ROOT = iqlabs.contract.getDbRootPda(iqlabs.utils.toSeedBytes("iq-git-v1"), PROGRAM_ID);

function gitTablePda(hint: string): PublicKey {
  return iqlabs.contract.getTablePda(DB_ROOT, iqlabs.utils.toSeedBytes(hint), PROGRAM_ID);
}

interface CommitRow {
  id: string;
  message: string;
  treeTxId: string;
  parentCommitId?: string;
  timestamp: number;
  author: string;
}

export async function readLatestCommit(owner: string, repo: string): Promise<CommitRow | null> {
  const rows = await readTableRowsGW<CommitRow>(gitTablePda(COMMIT_HINT(owner, repo)), 1);
  return rows[0] ?? null;
}

export async function loadTree(treeTxId: string): Promise<Record<string, { txId: string; hash: string }>> {
  const { data } = await readCodeInGW(treeTxId);
  if (data === null) throw new Error(`tree.json not found for ${treeTxId}`);
  return JSON.parse(data);
}

export async function loadBlob(txId: string): Promise<string> {
  const { data } = await readCodeInGW(txId);
  if (data === null) throw new Error(`blob not found for ${txId}`);
  return data;
}

// ---------------------------------------------------------------
// Generic table read + codeIn read
// ---------------------------------------------------------------

export async function readTableRowsGW<T>(tablePda: PublicKey, limit = 50): Promise<T[]> {
  try {
    const res = await gwFetch(`/table/${tablePda.toBase58()}/rows?limit=${limit}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data.rows ?? [];
    return rows as T[];
  } catch (e) {
    console.warn("[gateway] /table rows fallback to RPC", e);
    const rows = await iqlabs.reader.readTableRows(tablePda, { limit });
    return rows as T[];
  }
}

export async function readCodeInGW(sig: string): Promise<{ data: string | null; metadata: string }> {
  try {
    const res = await gwFetch(`/data/${sig}`);
    const json = await res.json();
    return { data: json.data ?? null, metadata: json.metadata ?? "" };
  } catch (e) {
    console.warn(`[gateway] /data/${sig.slice(0, 8)}… fallback to RPC`, e);
    return iqlabs.reader.readCodeIn(sig);
  }
}

// ---------------------------------------------------------------
// Write notify — fire-and-forget
// ---------------------------------------------------------------

export function notifyGateway(
  tablePda: string,
  txSignature: string,
  row?: object,
  signer?: string,
): void {
  const gw = getGateways()[0];
  fetch(`${gw}/table/${tablePda}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txSignature, row, signer }),
  }).catch(() => {});
}
