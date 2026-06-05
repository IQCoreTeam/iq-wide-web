"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  Anchor,
  Avatar,
  Button,
  Frame,
  GroupBox,
  ScrollView,
  Toolbar,
  Tooltip,
  Window,
  WindowContent,
  WindowHeader,
} from "react95";
import {
  profilePictureTxId,
  resolveProfilePictureSrc,
  type ProfileMeta,
} from "@/lib/profile/profile";
import { SOCIAL_PLATFORMS } from "@/lib/profile/socials";
import { FONT } from "@/lib/ui/typography";

function shortWallet(w: string) {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

const AvatarFrame = styled(Frame).attrs({ variant: "outside", shadow: false })`
  padding: 12px;
  display: inline-block;
  position: relative;
`;

/** Little Win95-style chip pinned to the avatar's corner, marking the picture
 *  as living on-chain. Uses the theme's raised-button look so it reads as part
 *  of the react95 surface rather than a flat web badge. */
const OnChainBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: ${FONT.meta}px;
  font-weight: 700;
  line-height: 1;
  color: ${({ theme }) => theme.materialText};
  background: ${({ theme }) => theme.material};
  border-top: 2px solid ${({ theme }) => theme.borderLightest};
  border-left: 2px solid ${({ theme }) => theme.borderLightest};
  border-bottom: 2px solid ${({ theme }) => theme.borderDarkest};
  border-right: 2px solid ${({ theme }) => theme.borderDarkest};
`;

const OnChainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Bio = styled.p`
  font-size: ${FONT.body}px;
  line-height: 1.4;
  white-space: pre-line;
  margin: 0;
`;

const SocialsRow = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const WalletRow = styled.button`
  all: unset;
  font-family: inherit;
  font-size: ${FONT.body}px;
  opacity: 0.85;
  cursor: pointer;
  word-break: break-all;
  text-align: center;
  width: 100%;

  &:hover {
    opacity: 1;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export function ProfileCard({
  walletAddress,
  profile,
  onEdit,
}: {
  walletAddress: string;
  profile: ProfileMeta | null;
  onEdit?: () => void;
}) {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [shared, setShared] = useState(false);

  const pictureTxId = profilePictureTxId(profile?.profilePicture);
  const pictureSrc = resolveProfilePictureSrc(profile?.profilePicture);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
  };

  const share = async () => {
    const url = `${window.location.origin}/${walletAddress}`;
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  const hasSocials =
    profile?.socials && SOCIAL_PLATFORMS.some((p) => profile.socials?.[p.key]);

  return (
    <Window style={{ width: "100%" }}>
      <WindowHeader>
        <span>profile.exe</span>
      </WindowHeader>
      <Toolbar>
        <Button
          variant="menu"
          size="sm"
          onClick={onEdit}
          disabled={!onEdit}
          title="Edit profile"
        >
          Edit
        </Button>
        <Tooltip text={shared ? "Link copied" : "Copy link to this profile"} enterDelay={300}>
          <Button variant="menu" size="sm" onClick={share}>
            {shared ? "Copied ✓" : "Share"}
          </Button>
        </Tooltip>
      </Toolbar>
      <WindowContent>
        <Column>
          <AvatarFrame>
            {pictureSrc ? (
              <Avatar size={112} square src={pictureSrc} alt="" />
            ) : (
              <Avatar size={112} square>?</Avatar>
            )}
            {pictureTxId && (
              <Tooltip text="This picture is stored on-chain" enterDelay={300}>
                <OnChainBadge>◆ ON-CHAIN</OnChainBadge>
              </Tooltip>
            )}
          </AvatarFrame>

          {pictureTxId && (
            <OnChainRow>
              <Button
                variant="menu"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://solscan.io/tx/${pictureTxId}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                View on Solscan ↗
              </Button>
            </OnChainRow>
          )}

          <h1 style={{ fontSize: FONT.title, fontWeight: 700, margin: 0 }}>
            {profile?.name || shortWallet(walletAddress)}
          </h1>

          {profile?.bio && (
            <Details>
              <GroupBox label="Bio">
                <Bio>{profile.bio}</Bio>
              </GroupBox>
            </Details>
          )}

          {hasSocials && (
            <Details>
              <GroupBox label="Socials">
                <ScrollView style={{ maxHeight: 160 }}>
                  <SocialsRow>
                    {SOCIAL_PLATFORMS.filter((p) => profile?.socials?.[p.key]).map((p) => {
                      const value = profile!.socials![p.key]!;
                      const href = p.toUrl(value);
                      return (
                        <li key={p.key}>
                          {href ? (
                            <Tooltip text={value} enterDelay={300}>
                              <Anchor
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: FONT.body }}
                              >
                                {p.label}
                              </Anchor>
                            </Tooltip>
                          ) : (
                            <Tooltip text={value} enterDelay={300}>
                              <Button variant="menu" size="sm">
                                {p.label}
                              </Button>
                            </Tooltip>
                          )}
                        </li>
                      );
                    })}
                  </SocialsRow>
                </ScrollView>
              </GroupBox>
            </Details>
          )}

          <Details>
            <GroupBox label="Wallet">
              <Tooltip text={copiedAddr ? "Copied" : "Click to copy"} enterDelay={300}>
                <WalletRow onClick={copyAddress} aria-label="Copy wallet address">
                  {copiedAddr ? "copied ✓" : walletAddress}
                </WalletRow>
              </Tooltip>
            </GroupBox>
          </Details>
        </Column>
      </WindowContent>
    </Window>
  );
}
