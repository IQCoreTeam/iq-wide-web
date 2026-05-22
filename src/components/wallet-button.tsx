"use client";

import { useEffect, useState } from "react";
import { Button } from "react95";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

function shortWallet(w: string) {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wallet = useWallet();
  const { setVisible } = useWalletModal();

  if (!mounted) return null;

  const address = wallet.publicKey?.toBase58();

  if (!wallet.connected || !address) {
    return (
      <Button size="sm" onClick={() => setVisible(true)}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={() => wallet.disconnect()} title="Click to disconnect">
      {shortWallet(address)}
    </Button>
  );
}
