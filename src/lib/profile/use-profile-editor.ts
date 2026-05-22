"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import iqlabs from "iqlabs-sdk";
import { PROGRAM_ID, ROOT_ID } from "@/lib/constants";
import type { ProfileMeta } from "./profile";

/**
 * Commits a ProfileMeta to chain in two steps:
 *   1. codeIn(jsonString)         → produces a txId holding the JSON
 *   2. updateUserMetadata(txId)   → links it onto the caller's user PDA
 *
 * No global directory write — the contract doesn't expose a user enumerator,
 * and maintaining a client-side registry was unreliable (first-writers would
 * bear extra cost and misses were silent). Discovery happens via direct
 * wallet-address lookup only.
 *
 * The profile's DbRoot is lazily initialized on first write. The "already in
 * use" race is expected when multiple clients try at once and is treated as
 * success.
 *
 * Invalidates ["profile", wallet] on success so useProfile re-renders
 * immediately instead of waiting for staleTime.
 */
export function useProfileEditor() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: ProfileMeta): Promise<{ txId: string }> => {
      if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
        throw new Error("Wallet not connected");
      }
      const signer = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: wallet.signAllTransactions.bind(wallet),
      };
      const programId = new PublicKey(PROGRAM_ID);
      const dbRootSeed = iqlabs.utils.toSeedBytes(ROOT_ID);
      const dbRoot = iqlabs.contract.getDbRootPda(dbRootSeed, programId);

      if (!(await connection.getAccountInfo(dbRoot))) {
        try {
          const builder = iqlabs.contract.createInstructionBuilder();
          const ix = iqlabs.contract.initializeDbRootInstruction(
            builder,
            {
              db_root: dbRoot,
              signer: wallet.publicKey,
              system_program: SystemProgram.programId,
            },
            { db_root_id: dbRootSeed },
          );
          const tx = new Transaction().add(ix);
          tx.feePayer = wallet.publicKey;
          const { blockhash } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          const signed = await signer.signTransaction(tx);
          await connection.sendRawTransaction(signed.serialize());
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (!/already in use|AlreadyInUse/i.test(msg)) throw e;
        }
      }

      const txId = await iqlabs.writer.codeIn(
        { connection, signer },
        [JSON.stringify(profile)],
        "profile-metadata",
        0,
      );
      if (!txId) throw new Error("codeIn returned no txId");

      await iqlabs.writer.updateUserMetadata(connection, signer, dbRootSeed, txId);

      return { txId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", wallet.publicKey?.toBase58()],
      });
    },
  });
}
