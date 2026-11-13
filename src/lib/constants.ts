// Shared constants. Env-derived values live here so the rest of the
// codebase imports string literals and stays predictable.
//
// `NEXT_PUBLIC_*` is the only way to surface env vars to the browser.
// Non-prefixed vars (server-only) don't belong in this file.

/** IQDB root that holds the profile metadata table (global user list). */
export const ROOT_ID = process.env.NEXT_PUBLIC_ROOT_ID || "iqprofile-root";

/** IQDB root used by IQ Pages deployments. Shared across ecosystem apps. */
export const IQPAGES_ROOT_ID = "iqpages-root";

/** Solana RPC endpoint used in the browser. Keyless and CORS-open for every
 *  origin that serves this app (browser.iqlabs.dev and any *.sol domain), so no
 *  API key lives in the client bundle. Override per build with NEXT_PUBLIC_RPC_URL. */
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://solana-rpc.publicnode.com";

/** IQ Gateway origin. Used for:
 *   - profile metadata fallback reads: `${GATEWAY_URL}/data/{txId}`
 *   - IQ Pages live URLs:              `${GATEWAY_URL}/site/{treeTxId}/{entry}`
 */
export const GATEWAY_URL = "https://gateway.iqlabs.dev";

/** IQ Wide Web (this app's public origin). A deployed IQ Pages site is opened
 *  as `${BROWSER_URL}/{commitTablePda}` — the resolver there picks the owner's
 *  latest commit + entry itself, so the link stays correct across re-commits
 *  without us pinning a treeTxId (unlike a raw `${GATEWAY_URL}/site/...` URL). */
export const BROWSER_URL = "https://browser.iqlabs.dev";

/** SolChat origin — deep link target for the SolChat tab. User URL:
 *  `${SOLCHAT_URL}/u/{walletAddress}`. */
export const SOLCHAT_URL = "https://chat.iqlabs.dev";

/** IQ GitHub frontend — used for `[View all repos →]` and post source links. */
export const IQGIT_URL = "https://git.iqlabs.dev";

/** IQChan (BlockChan) frontend — post cards deep-link here via hash router
 *  as `/#/po/{threadSeed}:{signature}`. */
export const IQCHAN_URL = "https://blockchan.sol.site";

/** HoodChan — the Robinhood Chain (EVM) sibling of BlockChan. Shown in place of
 *  BlockChan when the viewed wallet is a 0x address. */
export const HOODCHAN_URL = "https://hoodchan.xyz";

/** Solana program id for the IQLabs contract. */
export const PROGRAM_ID = "9KLLchQVJpGkw4jPuUmnvqESdR7mtNCYr3qS4iQLabs";
