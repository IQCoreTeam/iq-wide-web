// Pure helpers for the user inventory feed. No React.
//
// Why inventory is the source of truth for profile-net's right panel:
// every on-chain write by a user (IQChan post, IQ Git repo/commit, IQ Pages
// marker, wallet connection) stamps the UserInventory PDA via the
// contract's *_code_in instructions. So fetching a user's inventory
// returns the union of all their activity. We classify + dispatch to tabs.

/** One entry as returned by SDK's fetchInventoryTransactions or the
 *  gateway's `/user/<pubkey>/assets`. `blockTime` is optional on the SDK
 *  side — normalize to `number | null` so callers have one shape. */
export interface InventoryEntry {
  signature: string;
  slot: number;
  blockTime: number | null;
  /** "" means the full payload fits in `metadata.data` (inline). Otherwise
   *  points at a session or linked-list — fetch on demand via useRowData. */
  onChainPath: string;
  /** JSON string: `{ filetype, method, filename, total_chunks, data? }`. */
  metadata: string;
  /** Row body when the gateway has it cached — lets `classify()` match
   *  non-inline entries without a body fetch. Absent on the SDK fallback
   *  path; absent for inline rows (use `parseInlineRow` instead). */
  row?: Record<string, unknown>;
}

export interface InventoryMetadata {
  filetype?: string;
  method?: number;
  filename?: string;
  total_chunks?: number;
  /** Inline payload when small enough. Stringified JSON for row writes,
   *  base64 for binary. Absent when the entry is non-inline. */
  data?: string;
}

export function isInline(entry: InventoryEntry): boolean {
  return entry.onChainPath === "";
}

export function parseMetadata(entry: InventoryEntry): InventoryMetadata | null {
  try {
    return JSON.parse(entry.metadata) as InventoryMetadata;
  } catch {
    return null;
  }
}

/** Row writes (writeRow, IQChan post, etc.) stringify their JSON into
 *  `metadata.data`. Parse that one more time to get the row object. */
export function parseInlineRow(entry: InventoryEntry): Record<string, unknown> | null {
  const meta = parseMetadata(entry);
  if (!meta?.data || typeof meta.data !== "string") return null;
  try {
    return JSON.parse(meta.data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type AppKind =
  | "iqchan-post"
  | "iqgit-repo"
  | "iqgit-commit"
  | "iqgit-ref"
  | "iqgit-fork"
  | "iqgit-collab"
  | "iqpages-register"
  | "profile-meta"
  | "other";

/** Domain dispatch from a parsed row's shape. Order matters — narrow
 *  signatures first, generic last.
 *
 *  Row shapes:
 *  - iqchan post: writeRow of `{ sub, com, name, time, img?, threadPda, threadSeed }`
 *    (verified against iqchan/src/hooks/use-post.ts)
 *  - v2 git commit: `{ id, message, treeTxId, parentCommitId?, timestamp, author }`
 *    (no `repoName` — table itself is repo-scoped)
 *  - v2 git repo: `{ name, description, isPublic, timestamp }`
 *    (no `owner` — table itself is owner-scoped)
 *  - v1 git rows (legacy) still match the old `+ owner` / `+ repoName` shape.
 */
export function classify(row: Record<string, unknown> | null): AppKind {
  if (!row) return "other";

  // IQChan post — threadSeed + com are always present on both OP and reply.
  if (typeof row.threadSeed === "string" && typeof row.com === "string") {
    return "iqchan-post";
  }
  // Git commit — v2 (no repoName) + v1 (with repoName).
  if (typeof row.treeTxId === "string" && typeof row.id === "string" && typeof row.message === "string") {
    return "iqgit-commit";
  }
  // v1 git ref / fork / collaborator — left in for legacy rows.
  if (typeof row.refName === "string" && typeof row.commitId === "string") {
    return "iqgit-ref";
  }
  if (typeof row.forkRepoName === "string" && typeof row.originalRepoName === "string") {
    return "iqgit-fork";
  }
  if (typeof row.repoName === "string" && typeof row.userAddress === "string" && typeof row.role === "string") {
    return "iqgit-collab";
  }
  // Git repo — v2 (`{name, description, isPublic, timestamp}`) and v1
  // (`{name, description, owner, isPublic, timestamp}`) both match here.
  if (
    typeof row.name === "string" &&
    typeof row.isPublic === "boolean" &&
    typeof row.timestamp === "number"
  ) {
    return "iqgit-repo";
  }
  return "other";
}

/** Classify by the `metadata.filename` tag every IQ ecosystem write embeds
 *  in its codeIn call (e.g. "iqgit-blob:foo.png", "iqgit-tree", "iqchan-post",
 *  "iqpages-deploy"). This works on non-inline entries where the row body
 *  isn't available — gateway prefix or RPC fallback. Returns "other" when
 *  the tag is missing or unrecognized. */
export function classifyByFilename(filename: string | undefined): AppKind {
  if (!filename) return "other";
  if (filename === "iqchan-post") return "iqchan-post";
  if (filename === "iqgit-tree") return "iqgit-commit"; // tree blob is part of a commit
  if (filename.startsWith("iqgit-blob:")) return "iqgit-commit"; // file blob is part of a commit
  if (filename === "iqpages-deploy") return "iqpages-register";
  return "other";
}

/** Best-effort classifier for any inventory entry, inline or non-inline.
 *  Tries (in order):
 *   1. `entry.row` prefix from the gateway (most accurate)
 *   2. `parseInlineRow(entry)` for inline rows (only works when small)
 *   3. `metadata.filename` tag (works on non-inline when prefix is absent)
 */
export function classifyEntry(entry: InventoryEntry): AppKind {
  if (entry.row) {
    const k = classify(entry.row);
    if (k !== "other") return k;
  }
  if (isInline(entry)) {
    const inline = parseInlineRow(entry);
    const k = classify(inline);
    if (k !== "other") return k;
  }
  const meta = parseMetadata(entry);
  return classifyByFilename(meta?.filename);
}
