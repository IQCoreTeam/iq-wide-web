"use client";

import styled from "styled-components";
import { Button, Frame, Window, WindowContent, WindowHeader } from "react95";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { AppPanel } from "@/components/app-panel/app-panel";
import { LookupWindow } from "@/components/app-panel/lookup-window";
import { AppHeader } from "@/components/ui/app-header";
import { AppFooter } from "@/components/ui/app-footer";
import { PageContainer, ResponsiveGrid } from "@/components/ui/layout";
import { FONT } from "@/lib/ui/typography";

const PromptContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  text-align: center;
`;

/** 지갑 연결 전: PC에선 좌측 welcome + 우측 lookup 2칸으로 풀어 화면이
 *  허전하지 않게. 모바일은 기존처럼 welcome 단일 창 중앙.
 *  뷰포트 전체 뒤쪽에 solana_internet 로고를 워터마크로 깔아 데스크톱 배경 느낌. */
const Watermark = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: -1;

  img {
    width: min(900px, 90vw);
    height: auto;
    opacity: 0.16;
    filter: saturate(0) brightness(1.1);
  }

  @media (max-width: 900px) {
    img {
      width: min(520px, 95vw);
      opacity: 0.12;
    }
  }
`;

/** 두 창을 하나의 Win95 패널 안에 담아서 "대시보드 판" 느낌. 패널
 *  자체의 outside bevel 이 데스크톱 위에 떠있는 박스로 보여주고,
 *  그 안에서 welcome / lookup 두 섹션이 정렬됨. */
const WelcomePanel = styled(Frame).attrs({ variant: "outside", shadow: true })`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  background: ${({ theme }) => theme.material};

  @media (max-width: 900px) {
    max-width: 480px;
    padding: 12px;
  }
`;

const WelcomeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PanelTitle = styled.div`
  font-size: ${FONT.body}px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 4px 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.borderDark};
`;

export default function HomePage() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const myWallet = wallet.publicKey?.toBase58();

  if (!myWallet) {
    return (
      <>
        <Watermark aria-hidden>
          <img src="/solana_internet.png" alt="" />
        </Watermark>
        <PageContainer>
          <WelcomePanel>
            <PanelTitle>IQ Wide Web · Start</PanelTitle>
            <WelcomeGrid>
              <Window style={{ width: "100%" }}>
                <WindowHeader><span>welcome.exe</span></WindowHeader>
                <WindowContent>
                  <PromptContent>
                    <h1 style={{ fontSize: FONT.heading, margin: 0 }}>
                      Connect your wallet or search
                    </h1>
                    <p style={{ fontSize: FONT.body, margin: 0, opacity: 0.8 }}>
                      Connect to show your own profile, or look up any wallet
                      address on the right.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                      <Button size="sm" onClick={() => setVisible(true)}>
                        Connect Wallet
                      </Button>
                    </div>
                  </PromptContent>
                </WindowContent>
              </Window>
              <LookupWindow label="Look up any wallet" />
            </WelcomeGrid>
          </WelcomePanel>
        </PageContainer>
      </>
    );
  }

  return (
    <PageContainer>
      <AppHeader />
      <ResponsiveGrid>
        <ProfilePanel walletAddress={myWallet} />
        <AppPanel walletAddress={myWallet} />
      </ResponsiveGrid>
      <AppFooter wallet={myWallet} />
    </PageContainer>
  );
}
