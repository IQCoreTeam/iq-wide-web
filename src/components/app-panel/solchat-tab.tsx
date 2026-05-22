"use client";

import styled from "styled-components";
import { Button } from "react95";
import { SOLCHAT_URL } from "@/lib/constants";
import { FONT } from "@/lib/ui/typography";

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 16px;
  min-height: 220px;
`;

const Title = styled.p`
  margin: 0;
  font-size: ${FONT.heading}px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: ${FONT.body}px;
  opacity: 0.75;
  text-align: center;
  max-width: 320px;
`;

const OpenButton = styled(Button)`
  font-size: ${FONT.body}px;
  padding: 10px 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

export function SolChatTab({ walletAddress }: { walletAddress: string }) {
  const url = `${SOLCHAT_URL}/u/${walletAddress}`;
  return (
    <Center>
      <Title>SolChat</Title>
      <Subtitle>
        End-to-end encrypted DMs on Solana.
      </Subtitle>
      <OpenButton
        primary
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        DM to this user →
      </OpenButton>
    </Center>
  );
}
