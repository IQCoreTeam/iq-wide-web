"use client";

import Link from "next/link";
import styled from "styled-components";
import { Button } from "react95";
import { WalletButton } from "@/components/wallet-button";
import { FONT } from "@/lib/ui/typography";
import { TopBar } from "./topbar";

const Brand = styled.span`
  font-weight: 700;
  font-size: ${FONT.brand}px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** Top chrome for every page. `showBack` renders a "← Home" button before
 *  the brand — used on /[wallet], skipped on /. */
export function AppHeader({ showBack = false }: { showBack?: boolean }) {
  return (
    <TopBar>
      <Left>
        {showBack && (
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="menu" size="sm">← Home</Button>
          </Link>
        )}
        <Link href="/" style={{ textDecoration: "none" }}>
          <Brand>IQ Profile Net</Brand>
        </Link>
      </Left>
      <WalletButton />
    </TopBar>
  );
}
