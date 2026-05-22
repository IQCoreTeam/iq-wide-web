// IqpagesService — read-only client for the v2 single-table iqpages model.
//
// On-chain layout:
//   iqpages-root → "deployed" table → row { id, owner, repo, deployedAt }
//
// All reads go through `lib/gateway/reader` (gateway-first, RPC fallback).
// listAll = one HTTP call. Per-deployment metadata (iqpages.json /
// iqprofile.json) is fetched lazily, on click — never as a fan-out.

import { PublicKey } from "@solana/web3.js";
import iqlabs from "iqlabs-sdk";
import {
  loadBlob,
  loadTree,
  readLatestCommit,
  readTableRowsGW,
} from "@/lib/gateway/reader";

const ROOT_ID = "iqpages-root";
const TABLE_HINT = "deployed";
const CONFIG_FILENAME = "iqpages.json";
const PROFILE_FILENAME = "iqprofile.json";

export interface Deployment {
  id: string;
  owner: string;
  repo: string;
  deployedAt: number;
}

export interface IqpagesConfig {
  name: string;
  version: string;
  description: string;
  entry: string;
}

export interface IqprofileConfig {
  displayName: string;
  description?: string;
  icon?: string;
  routes?: { profile?: string; myPage?: string };
}

export interface LaunchTarget {
  treeTxId: string;
  config: IqpagesConfig | null;
  profile: IqprofileConfig | null;
}

function deployedTablePda(): PublicKey {
  const rootSeed = iqlabs.utils.toSeedBytes(ROOT_ID);
  const tableSeed = iqlabs.utils.toSeedBytes(TABLE_HINT);
  const dbRoot = iqlabs.contract.getDbRootPda(rootSeed);
  return iqlabs.contract.getTablePda(dbRoot, tableSeed);
}

/** Every deployment registered in the gallery. One HTTP call. */
export async function listAllDeployments(): Promise<Deployment[]> {
  return readTableRowsGW<Deployment>(deployedTablePda(), 1000);
}

/** Resolve everything needed to launch one app. Called only when the user
 *  clicks Open, so the per-deployment cost (commit + tree + optional
 *  iqprofile blob) is paid lazily, never as a fan-out across the gallery. */
export async function resolveLaunchTarget(
  owner: string,
  repo: string,
): Promise<LaunchTarget | null> {
  const latest = await readLatestCommit(owner, repo);
  if (!latest) return null;
  const tree = await loadTree(latest.treeTxId);

  const config = await readJsonFromTree<IqpagesConfig>(tree, CONFIG_FILENAME);
  const profile = await readJsonFromTree<IqprofileConfig>(tree, PROFILE_FILENAME);

  return { treeTxId: latest.treeTxId, config, profile };
}

async function readJsonFromTree<T>(
  tree: Record<string, { txId: string; hash: string }>,
  filename: string,
): Promise<T | null> {
  const entry = tree[filename];
  if (!entry?.txId) return null;
  const base64 = await loadBlob(entry.txId);
  // Files are committed as base64 (matches @iqlabs-official/git-sdk's blob
  // convention). Decode once before parsing.
  const decoded =
    typeof Buffer !== "undefined"
      ? Buffer.from(base64, "base64").toString("utf8")
      : new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
  try {
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}
