// Shape: classification by string form alone, no network calls.
// Probe (resolve.ts / use-resolve.ts) further narrows a pubkey into
// dbroot-table / wallet / not-found by asking the gateway.
export type Shape = "sol" | "sig" | "pubkey" | "invalid";

// Mirror of the gateway /dbroots payload (see iq-gateway src/routes/dbroots.ts).
// Shared by the matcher and the resolve hook, so it lives here rather than
// being inlined.
export interface TableHint {
  label: string | null;
  hex: string;
  tablePda: string | null;
}

export interface DbRoot {
  pda: string;
  id: string | null;
  idHex: string;
  creator: string | null;
  tableCreators: string[];
  extCreators: string[];
  tableSeeds: TableHint[];
  globalTableSeeds: TableHint[];
}

// What an identifier resolves to — the thing [ident]/page.tsx renders on.
export type IdentifierKind =
  | { kind: "wallet"; pubkey: string }
  // Matched a table PDA on a known DbRoot. `dbroot`/`hint` say which dApp and
  // which table, so the dApp-specific view (or the dev belongs-to popup) can
  // act on it.
  | { kind: "dbroot-table"; pubkey: string; dbroot: DbRoot; hint: TableHint }
  | { kind: "tx"; signature: string }
  | { kind: "not-found"; ident: string };
