// Single source of truth for iqpages on-chain identifiers.
//
// The deployed-table PDA is derived from these two strings via
// iqlabs-sdk (getDbRootPda → getTablePda). The PDA is hardcoded below
// instead of re-deriving at runtime because:
//   1. middleware runs on the Edge runtime where iqlabs-sdk + @solana/web3.js
//      can't reliably load — the hardcoded value lets middleware import this
//      file without pulling those dependencies in.
//   2. the value is stable: it only ever changes if ROOT_ID or TABLE_HINT
//      change, in which case re-derive (see scripts at the bottom comment)
//      and update DEPLOYED_TABLE_PDA here.
//
// If you ever update ROOT_ID or TABLE_HINT, regenerate the PDA with:
//   const { PublicKey } = await import("@solana/web3.js");
//   const iqlabs = (await import("iqlabs-sdk")).default;
//   const root = iqlabs.contract.getDbRootPda(iqlabs.utils.toSeedBytes(ROOT_ID));
//   const pda  = iqlabs.contract.getTablePda(root, iqlabs.utils.toSeedBytes(TABLE_HINT));
//   console.log(pda.toBase58());

export const IQPAGES_ROOT_ID = "iqpages-root";
export const IQPAGES_TABLE_HINT = "deployed";

/** PDA of the iqpages-root → "deployed" table. Verified on mainnet. */
export const DEPLOYED_TABLE_PDA = "CTfGJ36adkYNLyW6pB8LpqbWX4NUzxVuBretidYqZiYB";

export const IQPAGES_CONFIG_FILENAME = "iqpages.json";
export const IQPAGES_PROFILE_FILENAME = "iqprofile.json";
