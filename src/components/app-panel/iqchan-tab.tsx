"use client";

import styled from "styled-components";
import { Anchor, Frame, Hourglass } from "react95";
import {
  buildIqchanPostUrl,
  useUserPosts,
  type IqchanPostEntry,
} from "@/lib/iqchan/use-user-posts";
import { FONT } from "@/lib/ui/typography";

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

const Meta = styled.div`
  font-size: ${FONT.meta}px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const MetaLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Tag = styled.span<{ $kind: "op" | "reply" }>`
  font-size: ${FONT.meta}px;
  padding: 0 6px;
  border: 1px solid
    ${({ $kind }) => ($kind === "op" ? "#0a7f2e" : "#555")};
  color: ${({ $kind }) => ($kind === "op" ? "#0a7f2e" : "#555")};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Body = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Title = styled.p`
  margin: 0;
  font-weight: 700;
`;

const Stub = styled.p`
  margin: 0;
  opacity: 0.7;
  font-size: ${FONT.meta}px;
`;

const Empty = styled.p`
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: ${FONT.body}px;
  opacity: 0.7;
`;

function formatTime(t: number | null): string {
  if (!t) return "—";
  return new Date(t * 1000).toLocaleString();
}

function PostCard({ entry }: { entry: IqchanPostEntry }) {
  // OP vs reply is decided at parse time (presence of `sub` key on the raw
  // row — iqchan writes `sub: ""` on OP and omits the key on replies).
  // Non-inline stubs default to false because we don't know without the body.
  const isReply = entry.inline ? !entry.isOp : false;

  return (
    <Card as="li">
      <Meta>
        <MetaLeft>
          {entry.inline && (
            <Tag $kind={isReply ? "reply" : "op"}>
              {isReply ? "Reply" : "OP"}
            </Tag>
          )}
          <span>{entry.name || "anon"}</span>
        </MetaLeft>
        <span>{formatTime(entry.blockTime)}</span>
      </Meta>

      {entry.sub && <Title>{entry.sub}</Title>}

      {entry.inline && entry.com && <Body>{entry.com}</Body>}

      {!entry.inline && (
        <Stub>Long post — open on BlockChan to read the body.</Stub>
      )}

      <Anchor
        href={buildIqchanPostUrl(entry)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: FONT.meta, alignSelf: "flex-end" }}
      >
        Open BlockChan →
      </Anchor>
    </Card>
  );
}

export function IqChanTab({ walletAddress }: { walletAddress: string }) {
  const { data: posts, isLoading, error } = useUserPosts(walletAddress);

  if (error) {
    return <Empty style={{ color: "#b00020" }}>Failed to load posts.</Empty>;
  }
  if (isLoading) {
    return (
      <Empty>
        <Hourglass size={16} /> Loading…
      </Empty>
    );
  }
  if (!posts || posts.length === 0) {
    return <Empty>No BlockChan posts yet.</Empty>;
  }

  return (
    <List>
      {posts.map((p) => <PostCard key={p.signature} entry={p} />)}
    </List>
  );
}
