// Pure profile helpers. No React. Ported from
// solchat-web/components/users/profile-helpers.ts.
//
// A profile is JSON stored on the user's PDA. Small JSON is inlined in the
// account metadata; larger JSON is uploaded via codeIn and the account only
// keeps the resulting txId. Both paths decode into the same shape.

import { Buffer } from "buffer";
import type { AccountInfo } from "@solana/web3.js";
import iqlabs from "iqlabs-sdk";
import { GATEWAY_URL } from "@/lib/constants";
import type { SocialKey } from "./socials";

/** The fields we render. `encryptionPubKey` is only read when a DM flow needs
 *  it — kept optional so profile-net doesn't have to care. */
export interface ProfileMeta {
  name: string;
  bio?: string;
  profilePicture?: string; // URL or txId
  socials?: Partial<Record<SocialKey, string>>;
  encryptionPubKey?: string;
}

/** User PDA account layout written by the IQLabs contract:
 *    [8 discriminator][32 owner][u32 dataLen][data][u32 metadataLen][metadata]
 *  We only want the last segment — the JSON/txId string.
 *  Returns "" for any malformed/truncated buffer so the caller renders the
 *  "no profile yet" state instead of crashing. */
export function extractUserMetadata(info?: AccountInfo<Buffer> | null): string {
  if (!info?.data) return "";
  try {
    const data = Buffer.from(info.data);
    let offset = 8 + 32; // discriminator + owner
    if (offset + 4 > data.length) return "";
    const dataLen = data.readUInt32LE(offset);
    offset += 4 + dataLen;
    if (offset + 4 > data.length) return "";
    const metadataLen = data.readUInt32LE(offset);
    offset += 4;
    if (metadataLen <= 0 || offset + metadataLen > data.length) return "";
    return data.slice(offset, offset + metadataLen).toString("utf8").trim();
  } catch {
    return "";
  }
}

/** Resolves the raw metadata string into a ProfileMeta.
 *
 *  Short base58 strings (≤ 100 chars) are txIds — pull the real JSON from
 *  the chain via readCodeIn. Anything else is JSON we can parse directly.
 *  Returns null on any failure — the UI shows the empty state.
 */
/** Gateway returns `{ data, metadata, signature, ... }` — this helper peels
 *  off the envelope and treats 404 / empty / "[unable…]" as a soft miss.
 *  Exported because the inventory lazy-fetch hook uses the same endpoint. */
export async function fetchTxDataViaGateway(txId: string): Promise<string | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/data/${txId}`, { cache: "force-cache" });
    if (!res.ok) return null;
    const env = (await res.json()) as { data?: string | null };
    const data = env?.data;
    if (!data || data.startsWith("[unable")) return null;
    return data;
  } catch {
    return null;
  }
}

export async function parseMetadata(raw: string): Promise<ProfileMeta | null> {
  if (!raw || raw.length <= 2) return null;
  try {
    const isBase58TxId = raw.length <= 100 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(raw);
    if (isBase58TxId) {
      const fromGateway = await fetchTxDataViaGateway(raw);
      if (fromGateway) return JSON.parse(fromGateway) as ProfileMeta;
      const result = await iqlabs.reader.readCodeIn(raw);
      if (!result?.data || result.data.startsWith("[unable")) return null;
      return JSON.parse(result.data) as ProfileMeta;
    }
    return JSON.parse(raw) as ProfileMeta;
  } catch {
    return null;
  }
}
