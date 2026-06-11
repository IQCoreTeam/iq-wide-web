// Anyone can write a row into a repo's git_commits table, so the newest row
// isn't necessarily one the repo owner pushed. We serve the latest commit the
// table owner actually signed — `__signer` is the on-chain transaction signer
// (unforgeable), unlike `author`, which is just a string anyone can set.
//
// Pure + dependency-free so the Edge resolver (resolve-site.ts) can import it.

// How many recent rows to scan for an owner-signed one before giving up. Rows
// come newest-first; a repo where the owner's last 20 rows are all outsiders is
// treated as having no servable commit.
export const COMMIT_SCAN_LIMIT = 20;

interface SignedRow {
  treeTxId: string;
  __signer?: string;
}

/** The most recent row signed by `owner`, or null if none of the scanned rows
 *  were. Rows must be newest-first. */
export function latestOwnerRow<T extends SignedRow>(rows: T[], owner: string): T | null {
  return rows.find((r) => r.__signer === owner) ?? null;
}

/** treeTxId of the most recent owner-signed row, or null. */
export function latestOwnerCommit<T extends SignedRow>(rows: T[], owner: string): string | null {
  return latestOwnerRow(rows, owner)?.treeTxId ?? null;
}
