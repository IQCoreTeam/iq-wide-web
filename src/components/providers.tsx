"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import windows1 from "react95/dist/themes/windows1";
import iqlabs from "iqlabs-sdk";
import { RPC_URL } from "@/lib/constants";
import { StyledRegistry } from "./styled-registry";
import { GlobalStyle } from "./global-style";
import { BootSplash } from "./boot-splash";

import "@solana/wallet-adapter-react-ui/styles.css";

// SDK reader helpers keep their own Connection. Without setRpcUrl they hit
// the public mainnet-beta endpoint, which 403s from most origins.
iqlabs.setRpcUrl(RPC_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { refetchOnWindowFocus: false } },
    }),
  );

  // wallets=[] → Wallet Standard auto-detects installed extensions.
  const wallets = useMemo(() => [], []);

  return (
    <StyledRegistry>
      <ThemeProvider theme={windows1}>
        <GlobalStyle />
        <BootSplash />
        <ConnectionProvider endpoint={RPC_URL}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
    </StyledRegistry>
  );
}
