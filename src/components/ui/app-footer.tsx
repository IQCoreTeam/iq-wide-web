"use client";

import { StatusBar } from "./status-bar";

function shortWallet(w: string) {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

/** Bottom chrome for every page. `viewing` swaps the "user:" cell for a
 *  "viewing:" cell — used on /[wallet], omitted on /. When neither wallet
 *  nor viewing is given the middle cell falls back to "guest". */
export function AppFooter({
  wallet,
  viewing,
}: {
  wallet?: string;
  viewing?: string;
}) {
  const middle = viewing
    ? `viewing: ${shortWallet(viewing)}`
    : wallet
      ? `user: ${shortWallet(wallet)}`
      : "guest";

  return (
    <StatusBar
      cells={[
        <span key="net">mainnet-beta</span>,
        <span key="who">{middle}</span>,
        <span key="ok">READY</span>,
      ]}
    />
  );
}
