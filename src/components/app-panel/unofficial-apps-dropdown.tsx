"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Anchor,
  Button,
  GroupBox,
  Hourglass,
  Select,
} from "react95";
import { IQGIT_URL } from "@/lib/constants";
import {
  buildLaunchUrl,
  useIqpagesList,
  useResolveLaunchTarget,
  type Deployment,
} from "@/lib/iqpages/use-iqpages-data";
import { FONT } from "@/lib/ui/typography";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: ${FONT.body}px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const Meta = styled.p`
  font-size: ${FONT.meta}px;
  opacity: 0.75;
  margin: 0;
`;

const Disclaimer = styled.p`
  font-size: ${FONT.meta}px;
  margin: 0;
  padding: 6px 8px;
  line-height: 1.35;
  font-weight: 700;
  color: #b00020;
  border: 1px solid #b00020;
  background: #ffe5ea;
`;

const Confirm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: ${FONT.body}px;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

function dyorKey(owner: string, repo: string) {
  return `iqprofilenet:dyor-ack:${owner}/${repo}`;
}

const appKey = (d: Pick<Deployment, "owner" | "repo">) => `${d.owner}/${d.repo}`;

export function UnofficialAppsDropdown({ walletAddress }: { walletAddress: string }) {
  const { data: deployments, isLoading, error } = useIqpagesList();
  const resolveTarget = useResolveLaunchTarget();

  const options = useMemo(
    () =>
      (deployments ?? []).map((d) => ({
        value: appKey(d),
        label: d.repo,
      })),
    [deployments],
  );

  // Default to the first deployment so react95's Select has a matching
  // option from the start.
  const firstKey = options[0]?.value ?? "";
  const [selectedKey, setSelectedKey] = useState<string>(firstKey);
  useEffect(() => {
    if (!selectedKey && firstKey) setSelectedKey(firstKey);
  }, [firstKey, selectedKey]);

  const [pending, setPending] = useState<Deployment | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const launch = async (d: Deployment) => {
    setOpening(true);
    setOpenError(null);
    try {
      const target = await resolveTarget(d.owner, d.repo);
      if (!target) {
        setOpenError(`No commits in ${d.owner.slice(0, 4)}…/${d.repo}`);
        return;
      }
      const url = buildLaunchUrl(target, walletAddress);
      window.localStorage.setItem(dyorKey(d.owner, d.repo), "1");
      window.open(url, "_blank", "noopener,noreferrer");
      setPending(null);
    } catch (e) {
      console.warn("launch failed", e);
      setOpenError(e instanceof Error ? e.message : "Failed to open");
    } finally {
      setOpening(false);
    }
  };

  const openSelected = () => {
    const match = (deployments ?? []).find((d) => appKey(d) === selectedKey);
    if (!match) return;
    if (window.localStorage.getItem(dyorKey(match.owner, match.repo))) {
      void launch(match);
      return;
    }
    setPending(match);
  };

  return (
    <Body>
      <GroupBox label="Unofficial apps (IQ Pages)">
        {error ? (
          <Meta style={{ color: "#b00020" }}>
            Failed to load: {error instanceof Error ? error.message : "unknown error"}
          </Meta>
        ) : isLoading ? (
          <Row>
            <Hourglass size={16} />
            <Meta>Loading deployments…</Meta>
          </Row>
        ) : (deployments ?? []).length === 0 ? (
          <Meta>No deployments yet.</Meta>
        ) : pending ? (
          <Confirm>
            <strong style={{ fontSize: FONT.body }}>{pending.repo}</strong>
            <Meta>
              {pending.owner.slice(0, 4)}…{pending.owner.slice(-4)}
            </Meta>
            <Anchor
              href={`${IQGIT_URL}/${pending.owner}/${pending.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: FONT.meta }}
            >
              View source →
            </Anchor>
            {openError && (
              <Meta style={{ color: "#b00020" }}>{openError}</Meta>
            )}
            <ConfirmActions>
              <Button size="sm" onClick={() => setPending(null)} disabled={opening}>
                Cancel
              </Button>
              <Button size="sm" primary onClick={() => void launch(pending)} disabled={opening}>
                {opening ? "Opening…" : "Open"}
              </Button>
            </ConfirmActions>
          </Confirm>
        ) : (
          <Row>
            <Select
              value={selectedKey}
              options={options}
              onChange={(o) => setSelectedKey(o.value)}
              width="100%"
            />
            <Button size="sm" onClick={openSelected} disabled={!selectedKey || opening}>
              {opening ? "…" : "Open"}
            </Button>
          </Row>
        )}
        {openError && !pending && (
          <Meta style={{ color: "#b00020" }}>{openError}</Meta>
        )}
      </GroupBox>

      <Disclaimer>
        ⚠ WARNING — Unofficial apps can be published by anyone. IQ Labs
        does not audit them. DYOR before connecting your wallet.
      </Disclaimer>
    </Body>
  );
}
