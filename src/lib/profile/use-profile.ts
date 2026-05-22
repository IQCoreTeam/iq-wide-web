"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import iqlabs from "iqlabs-sdk";
import { PROGRAM_ID } from "@/lib/constants";
import { extractUserMetadata, parseMetadata, type ProfileMeta } from "./profile";

/**
 * Reads a wallet's on-chain profile. Returns null when the user hasn't
 * written one yet — UI shows the empty state instead of spinner-forever.
 */
export function useProfile(walletAddress: string | undefined) {
  const { connection } = useConnection();

  return useQuery<ProfileMeta | null>({
    queryKey: ["profile", walletAddress],
    queryFn: async () => {
      const owner = new PublicKey(walletAddress!);
      const userPda = iqlabs.contract.getUserPda(owner, new PublicKey(PROGRAM_ID));
      const info = await connection.getAccountInfo(userPda);
      const raw = extractUserMetadata(info);
      return raw ? parseMetadata(raw) : null;
    },
    enabled: !!walletAddress,
    staleTime: 60_000,
    retry: 1,
    retryDelay: 1500,
  });
}
