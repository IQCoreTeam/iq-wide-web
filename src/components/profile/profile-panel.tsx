"use client";

import { useState } from "react";
import styled from "styled-components";
import { Hourglass, Window, WindowContent, WindowHeader } from "react95";
import { useWallet } from "@solana/wallet-adapter-react";
import { ProfileCard } from "./profile-card";
import { ProfileEditor } from "./profile-editor";
import { useProfile } from "@/lib/profile/use-profile";
import { FONT } from "@/lib/ui/typography";

const StatusWindow = styled(Window)`
  width: 100%;
`;

const StatusContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  font-size: ${FONT.body}px;
`;

const ErrorText = styled.p`
  color: #b00020;
  margin: 0;
`;

/**
 * Self-contained profile surface: loading / error / display / edit, for one
 * wallet. Used by home (viewer's own wallet) and /[wallet] (route param).
 */
export function ProfilePanel({ walletAddress }: { walletAddress: string }) {
  const viewer = useWallet();
  const isOwner = viewer.publicKey?.toBase58() === walletAddress;
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading, error } = useProfile(walletAddress);

  if (isLoading) {
    return (
      <StatusWindow>
        <WindowHeader><span>profile.exe</span></WindowHeader>
        <WindowContent>
          <StatusContent>
            <Hourglass size={32} />
            <span>Loading profile…</span>
          </StatusContent>
        </WindowContent>
      </StatusWindow>
    );
  }

  if (error) {
    return (
      <StatusWindow>
        <WindowHeader><span>error</span></WindowHeader>
        <WindowContent>
          <StatusContent>
            <ErrorText>
              {error instanceof Error ? error.message : "Failed to load profile"}
            </ErrorText>
          </StatusContent>
        </WindowContent>
      </StatusWindow>
    );
  }

  if (editing && isOwner) {
    return (
      <ProfileEditor
        initial={profile ?? null}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <ProfileCard
      walletAddress={walletAddress}
      profile={profile ?? null}
      onEdit={isOwner ? () => setEditing(true) : undefined}
    />
  );
}
