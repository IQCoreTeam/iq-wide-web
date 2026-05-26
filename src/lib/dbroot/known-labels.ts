// Legacy DbRoots (created before the SDK's `table_hint` upgrade on 2026-04-06)
// stored their `id` as the hashed seed bytes — no raw utf-8 label on chain. On
// reads the gateway returns `id: null` for these, and the original string is
// unrecoverable from the hash alone. New DbRoots store raw bytes and don't
// need this; they come back with `id` already populated.
//
// So this list is bounded: only legacy ids that already exist on chain. It
// doesn't grow with the ecosystem. Display-only — fetch keys stay hex/pda
// throughout, so missing here just means the tree shows hex for that node.
//
// Two hash algorithms coexist for legacy roots:
//  - keccak256 — official SDK toSeedBytes
//  - sha256    — some external writers (e.g. clawbal-plugin)
// We try both at import time and the lookup is a single Map.get.

import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";

const LEGACY_IDS = [
  "iqchan",
  "iq-git-v1",
  "iqpages-root",
  "clawbal",
  "clawbal-chat",
  "clawbal-root",
  "clawbal-iqlabs",
];

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

const HEX_BY_LABEL = (() => {
  const m = new Map<string, string>();
  for (const id of LEGACY_IDS) {
    const utf8 = new TextEncoder().encode(id);
    m.set(toHex(keccak_256(utf8)), id);
    m.set(toHex(sha256(utf8)), id);
  }
  return m;
})();

/** Display-only label resolver. Raw utf-8 id wins; legacy hashed ids are
 *  looked up against the bounded LEGACY_IDS dictionary. */
export function resolveDbRootLabel(id: string | null, idHex: string): string | null {
  if (id) return id;
  return HEX_BY_LABEL.get(idHex.toLowerCase()) ?? null;
}
