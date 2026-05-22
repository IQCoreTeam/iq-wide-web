// Shared constants. Env-derived values live here so the rest of the
// codebase imports string literals and stays predictable.
//
// `NEXT_PUBLIC_*` is the only way to surface env vars to the browser.
// Non-prefixed vars (server-only) don't belong in this file.

/** IQDB root that holds the profile metadata table (global user list). */
export const ROOT_ID = process.env.NEXT_PUBLIC_ROOT_ID || "iqprofile-root";

/** IQDB root used by IQ Pages deployments. Shared across ecosystem apps. */
export const IQPAGES_ROOT_ID = "iqpages-root";

/** Solana RPC endpoint. Same Helius key as on-chaingit-frontend so the
 *  browser-origin whitelist already covers this domain. */
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=767cde04-93dd-4e62-9580-978c74febc93";

/** IQ Gateway origin. Used for:
 *   - profile metadata fallback reads: `${GATEWAY_URL}/data/{txId}`
 *   - IQ Pages live URLs:              `${GATEWAY_URL}/site/{treeTxId}/{entry}`
 */
export const GATEWAY_URL = "https://gateway.solanainternet.com";

/** SolChat origin — deep link target for the SolChat tab. User URL:
 *  `${SOLCHAT_URL}/u/{walletAddress}`. */
export const SOLCHAT_URL = "https://chat.iqlabs.dev";

/** IQ GitHub frontend — used for `[View all repos →]` and post source links. */
export const IQGIT_URL = "https://git.iqlabs.dev";

/** IQChan (BlockChan) frontend — post cards deep-link here via hash router
 *  as `/#/po/{threadSeed}:{signature}`. */
export const IQCHAN_URL = "https://blockchan.sol.site";

/** Solana program id for the IQLabs contract. */
export const PROGRAM_ID = "9KLLchQVJpGkw4jPuUmnvqESdR7mtNCYr3qS4iQLabs";
