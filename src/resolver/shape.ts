import type { Shape } from "./types";

// Base58 alphabet, no 0/O/I/l. Ed25519 pubkeys serialize to 32 raw bytes →
// 43-44 base58 chars; we accept down to 32 for compatibility with truncated
// inputs in the wild. Tx signatures are 64 raw bytes → 87-88 base58 chars.
const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

export function shapeOf(raw: string | undefined | null): Shape {
  if (!raw) return "invalid";
  const s = raw.trim();
  if (!s) return "invalid";
  if (s.toLowerCase().endsWith(".sol")) return "sol";
  if (SIG_RE.test(s)) return "sig";
  if (PUBKEY_RE.test(s)) return "pubkey";
  return "invalid";
}
