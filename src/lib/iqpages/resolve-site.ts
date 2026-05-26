// Server-side resolver: given an identifier (a .sol domain, a pubkey, ...),
// is it a git repo that's deployed on iqpages? If yes, return its current
// treeTxId so middleware can rewrite the request into /site/{treeTxId}/...
// and the visitor sees the live site while keeping the original URL.
//
// Edge-runtime safe: only uses fetch + JSON. No iqlabs-sdk, no @solana/web3.js.

import { GATEWAY_URL } from "@/lib/constants";
import { DEPLOYED_TABLE_PDA } from "./constants";

const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function gwJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[middleware] gateway fetch failed: ${path}`, e);
    return null;
  }
}

interface SnsResult { owner: string | null; record: string | null }
interface TableMeta { name: string }
interface RowsResult<T> { rows?: T[] }
interface DeployedRow { id: string; owner: string; repo: string }
interface CommitRow { treeTxId: string }
interface Manifest { indexPath: string; files: Record<string, string> }

/** Pick the file to serve when the visitor hits /{ident} with no path. The
 *  gateway falls back to manifest.indexPath, but some sites ship a manifest
 *  whose indexPath ("index.html") doesn't actually exist in `files` — they
 *  picked a different entry (e.g. "gameboy.html") at deploy time. So we look
 *  up the manifest ourselves and prefer the first .html that's actually in
 *  `files`, with indexPath as a final fallback. */
async function pickEntry(treeTxId: string): Promise<string> {
  const manifest = await gwJson<Manifest>(`/site/${treeTxId}/manifest`);
  if (!manifest) return "index.html";
  if (manifest.files[manifest.indexPath]) return manifest.indexPath;
  const firstHtml = Object.keys(manifest.files).find((p) => p.endsWith(".html"));
  return firstHtml ?? manifest.indexPath;
}

/** Turn a .sol domain into the pubkey it points at (record beats owner —
 *  see iq-wide-web resolver). Plain pubkeys pass through unchanged. */
async function snsResolve(ident: string): Promise<string | null> {
  if (!ident.toLowerCase().endsWith(".sol")) {
    return PUBKEY_RE.test(ident) ? ident : null;
  }
  const sns = await gwJson<SnsResult>(`/sns/${ident}`);
  if (!sns) return null;
  return sns.record ?? sns.owner;
}

/** Resolve to {treeTxId, entry} when ident is a deployed git repo; otherwise
 *  null. `entry` is the file to serve when the visitor requests /{ident} with
 *  no sub-path. */
export async function resolveDeployedSite(
  ident: string,
): Promise<{ treeTxId: string; entry: string } | null> {
  const pubkey = await snsResolve(ident);
  if (!pubkey) return null;

  // The pubkey must be a commit-table PDA whose hint is git_commits:OWNER:REPO.
  // /table/{pda}/meta 404s for non-tables (a wallet), so non-git just returns null.
  const meta = await gwJson<TableMeta>(`/table/${pubkey}/meta`);
  const name = meta?.name ?? "";
  if (!name.startsWith("git_commits:")) return null;
  const [, owner, repo] = name.split(":");
  if (!owner || !repo) return null;

  // Is this repo registered on iqpages?
  const deployed = await gwJson<RowsResult<DeployedRow>>(`/table/${DEPLOYED_TABLE_PDA}/rows?limit=1000`);
  const id = `${owner}:${repo}`;
  if (!deployed?.rows?.some((r) => r.id === id)) return null;

  // Latest commit on this repo carries the treeTxId we serve from.
  const commits = await gwJson<RowsResult<CommitRow>>(`/table/${pubkey}/rows?limit=1`);
  const treeTxId = commits?.rows?.[0]?.treeTxId;
  if (!treeTxId) return null;

  const entry = await pickEntry(treeTxId);
  return { treeTxId, entry };
}
