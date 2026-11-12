"use client";

import { useState } from "react";
import styled from "styled-components";
import { Anchor, Button, Frame, Hourglass } from "react95";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInventoryGW } from "@/lib/gateway/reader";
import { GATEWAY_URL } from "@/lib/constants";
import {
  isInline,
  parseInlineRow,
  parseMetadata,
  type InventoryEntry,
} from "@/lib/inventory/inventory";
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

const Meta = styled.div`
  flex-wrap: wrap;
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
  min-width: 0;
`;

const Tag = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: ${FONT.meta}px;
  padding: 0 6px;
  border: 1px solid #0a7f2e;
  color: #0a7f2e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

const Body = styled.p<{ $mono?: boolean }>`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ${({ $mono }) => ($mono ? "'DejaVu Sans Mono', ui-monospace, monospace" : "inherit")};
  font-size: ${({ $mono }) => ($mono ? 9 : FONT.body)}px;
  line-height: ${({ $mono }) => ($mono ? 1 : 1.4)};
`;

const Thumb = styled.img`
  display: block;
  max-width: 100%;
  max-height: 200px;
  margin-top: 2px;
`;

const Stub = styled.p`
  margin: 0;
  opacity: 0.7;
  font-size: ${FONT.meta}px;
`;

const Links = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: ${FONT.meta}px;
`;

const Empty = styled.p`
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: ${FONT.body}px;
  opacity: 0.7;
`;

const TEXT_PREVIEW_CHARS = 300;

function formatTime(t: number | null): string {
  if (!t) return "unknown time";
  return new Date(t * 1000).toLocaleString();
}

function shortSig(sig: string): string {
  return `${sig.slice(0, 6)}…${sig.slice(-4)}`;
}

/** What a card shows before the user opens the inscription.
 *  - `text`: body we already hold (inline rows ride in the inventory feed).
 *  - `image`: ask the gateway's /img route for the bytes (it unwraps Code In
 *    `{kind, body}` rows, so this also covers session / linked-list uploads).
 *  Non-inline bodies are never fetched here: /img either renders or 404s,
 *  and the card falls back to a stub with the chunk count. */
interface Preview {
  tag: string;
  text?: string;
  mono?: boolean;
  image?: boolean;
}

function previewOf(entry: InventoryEntry): Preview {
  const meta = parseMetadata(entry);
  const tag = meta?.filename ?? meta?.filetype ?? "inscription";
  if (!isInline(entry)) return { tag, image: true };

  const row = parseInlineRow(entry);
  // Code In board rows (iq6900): `{ kind: text|ascii|image|file|audio|token, body, who }`.
  if (row && typeof row.kind === "string") {
    const body = typeof row.body === "string" ? row.body : "";
    if (body.startsWith("data:image/")) return { tag: row.kind, image: true };
    if (body.startsWith("data:")) return { tag: row.kind };
    return { tag: row.kind, text: body, mono: row.kind === "ascii" };
  }
  // Any other inline JSON (NFT metadata, profile, table rows): name or compact JSON.
  if (row) {
    const name = typeof row.name === "string" ? row.name : null;
    return { tag, text: name ?? JSON.stringify(row) };
  }
  return typeof meta?.data === "string" ? { tag, text: meta.data } : { tag };
}

function EntryCard({ entry }: { entry: InventoryEntry }) {
  const preview = previewOf(entry);
  const chunks = parseMetadata(entry)?.total_chunks ?? 1;
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = preview.image && !thumbFailed;
  const text = preview.text
    ? preview.text.length > TEXT_PREVIEW_CHARS
      ? `${preview.text.slice(0, TEXT_PREVIEW_CHARS)}…`
      : preview.text
    : "";

  return (
    <Card as="li">
      <Meta>
        <MetaLeft>
          <Tag>{preview.tag}</Tag>
          {chunks > 1 && <span>{chunks} chunks</span>}
        </MetaLeft>
        <span>{formatTime(entry.blockTime)}</span>
      </Meta>

      {text && <Body $mono={preview.mono}>{text}</Body>}

      {showThumb && (
        <Thumb
          src={`${GATEWAY_URL}/img/${entry.signature}.png`}
          alt={preview.tag}
          loading="lazy"
          onError={() => setThumbFailed(true)}
        />
      )}

      {!text && !showThumb && (
        <Stub>
          {chunks > 1
            ? `Stored in ${chunks} chunks. Open to view the full inscription.`
            : "Open to view this inscription."}
        </Stub>
      )}

      <Links>
        <Anchor
          href={`https://solscan.io/tx/${entry.signature}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: FONT.meta }}
        >
          {shortSig(entry.signature)}
        </Anchor>
        <Anchor
          href={`${GATEWAY_URL}/view/${entry.signature}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: FONT.meta }}
        >
          Open →
        </Anchor>
      </Links>
    </Card>
  );
}

/** Every code-in write by this wallet, newest first: the UserInventory PDA
 *  feed the other tabs filter from, shown unfiltered. */
export function InventoryTab({ walletAddress }: { walletAddress: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["inventory-pages", walletAddress],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => pageParam
      ? fetchInventoryGW(walletAddress, 100, pageParam)
      : queryClient.fetchQuery({
          queryKey: ["inventory", walletAddress, 100],
          queryFn: () => fetchInventoryGW(walletAddress, 100),
          staleTime: 60_000,
        }),
    // The SDK filters non-inscription transactions, so a short page does
    // not mean the history ended. Stop only after an empty page.
    getNextPageParam: (page) => page.at(-1)?.signature,
    staleTime: 60_000,
    enabled: !!walletAddress,
  });
  const entries = data?.pages.flat();

  if (error && !entries?.length) {
    return <Empty style={{ color: "#b00020" }}>Failed to load inventory.</Empty>;
  }
  if (isLoading) {
    return (
      <Empty>
        <Hourglass size={16} /> Loading…
      </Empty>
    );
  }
  if (!entries || entries.length === 0) {
    return <Empty>No inscriptions yet.</Empty>;
  }

  return (
    <Wrapper>
      <SummaryRow>
        <span>
          {entries.length} inscription{entries.length === 1 ? "" : "s"}
        </span>
        <span>newest first</span>
      </SummaryRow>
      <List>
        {entries.map((e) => <EntryCard key={e.signature} entry={e} />)}
      </List>
      {error && <Stub>Could not load more inscriptions. Please try again.</Stub>}
      {hasNextPage && (
        <Button disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </Wrapper>
  );
}
