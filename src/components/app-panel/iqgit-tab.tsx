"use client";

import styled from "styled-components";
import { Anchor, Frame, Hourglass } from "react95";
import { IQGIT_URL } from "@/lib/constants";
import { useUserRepos, type IqgitRepoEntry } from "@/lib/iqgit/use-user-repos";
import { FONT } from "@/lib/ui/typography";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: ${FONT.meta}px;
  opacity: 0.8;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Card = styled(Frame).attrs({ variant: "field", shadow: false })`
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${FONT.body}px;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Name = styled.span`
  font-weight: 700;
  word-break: break-all;
`;

const Badge = styled.span<{ $public: boolean }>`
  font-size: ${FONT.meta}px;
  padding: 1px 6px;
  border: 1px solid ${({ $public }) => ($public ? "#0a7f2e" : "#b08900")};
  color: ${({ $public }) => ($public ? "#0a7f2e" : "#b08900")};
`;

const Desc = styled.p`
  margin: 0;
  opacity: 0.85;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MetaLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: ${FONT.meta}px;
  opacity: 0.7;
`;

const Empty = styled.p`
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: ${FONT.body}px;
  opacity: 0.7;
`;

const PREVIEW_COUNT = 3;

function formatTime(t: number): string {
  if (!t) return "—";
  return new Date(t).toLocaleDateString();
}

function RepoCard({ repo }: { repo: IqgitRepoEntry }) {
  const deepLink = `${IQGIT_URL}/${repo.owner}/${repo.name}`;
  return (
    <Card as="li">
      <NameRow>
        <Name>{repo.name}</Name>
        <Badge $public={repo.isPublic}>{repo.isPublic ? "PUB" : "PVT"}</Badge>
      </NameRow>
      {repo.description && <Desc>{repo.description}</Desc>}
      <MetaLine>
        <span>{formatTime(repo.timestamp)}</span>
        <Anchor href={deepLink} target="_blank" rel="noopener noreferrer">
          Open →
        </Anchor>
      </MetaLine>
    </Card>
  );
}

export function IqGitTab({ walletAddress }: { walletAddress: string }) {
  const { data: repos, isLoading, error } = useUserRepos(walletAddress);
  const viewAllUrl = `${IQGIT_URL}/${walletAddress}`;

  if (error) {
    return <Empty style={{ color: "#b00020" }}>Failed to load repos.</Empty>;
  }
  if (isLoading) {
    return (
      <Empty>
        <Hourglass size={16} /> Loading…
      </Empty>
    );
  }
  if (!repos || repos.length === 0) {
    return <Empty>No repos yet.</Empty>;
  }

  const preview = repos.slice(0, PREVIEW_COUNT);
  const extraCount = Math.max(0, repos.length - PREVIEW_COUNT);

  return (
    <Wrapper>
      <SummaryRow>
        <span>
          {repos.length} repo{repos.length === 1 ? "" : "s"}
        </span>
        <Anchor href={viewAllUrl} target="_blank" rel="noopener noreferrer">
          View all on IQ GitHub →
        </Anchor>
      </SummaryRow>
      <List>
        {preview.map((r) => <RepoCard key={r.signature} repo={r} />)}
      </List>
      {extraCount > 0 && (
        <SummaryRow>
          <span style={{ opacity: 0.7 }}>+{extraCount} more</span>
          <Anchor href={viewAllUrl} target="_blank" rel="noopener noreferrer">
            Open IQ GitHub →
          </Anchor>
        </SummaryRow>
      )}
    </Wrapper>
  );
}
