"use client";

// Home is a tiny README + a live search box. The search hits the gateway
// catalog (gwFetch /search) and renders hits inline. Click behavior on each
// hit is deferred — we just want results visible first.

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Button, GroupBox, TextInput, Window, WindowContent, WindowHeader } from "react95";
import { FONT } from "@/lib/ui/typography";
import { searchCatalog, type SearchHit } from "@/lib/search";

const Page = styled.div`
  min-height: 100vh;
  padding: 24px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
`;

const Shell = styled(Window)`
  width: 100%;
  max-width: 760px;
`;

const Section = styled.div`
  padding: 12px 4px;
  & + & { margin-top: 8px; }
`;

const Mono = styled.code`
  font-family: "DejaVu Sans Mono", ui-monospace, monospace;
  font-size: ${FONT.meta}px;
  background: #000;
  color: #41ff00;
  padding: 1px 6px;
`;

const SearchRow = styled.form`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ResultList = styled.ul`
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ResultCard = styled.li`
  padding: 8px 4px;
  border-top: 1px dotted rgba(0, 0, 0, 0.25);
  &:first-child { border-top: none; }
`;

const Breadcrumb = styled.div`
  font-size: ${FONT.meta}px;
  opacity: 0.7;
`;

const Title = styled.div`
  font-size: ${FONT.body}px;
  font-weight: 700;
  word-break: break-all;
`;

const Snippet = styled.div`
  font-size: ${FONT.meta}px;
  opacity: 0.85;
  margin-top: 2px;
  word-break: break-word;
`;

export default function HomePage() {
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) { setHits(null); return; }
    setLoading(true);
    try {
      setHits(await searchCatalog(term));
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Shell>
        <WindowHeader><span>[ browser.iqlabs.dev ]</span></WindowHeader>
        <WindowContent>
          <Section>
            <h1 style={{ fontSize: FONT.heading, margin: 0 }}>IQ Wide Web</h1>
            <p style={{ fontSize: FONT.body, marginTop: 6, opacity: 0.8 }}>
              A native browser for the IQLabs Solana ecosystem. Lives at{" "}
              <Mono>browser.iqlabs.dev</Mono>.
            </p>
          </Section>

          <Section>
            <GroupBox label="Search">
              <SearchRow onSubmit={runSearch}>
                <TextInput
                  placeholder="search dApps, tables, posts…"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button type="submit" disabled={loading || !term.trim()}>
                  {loading ? "…" : "Search"}
                </Button>
              </SearchRow>
              {hits !== null && (
                <ResultList>
                  {hits.length === 0 && (
                    <li style={{ fontSize: FONT.meta, opacity: 0.6, padding: "4px 0" }}>
                      no results
                    </li>
                  )}
                  {hits.map((h) => (
                    <ResultCard key={`${h.kind}:${h.id}`}>
                      <Breadcrumb>
                        {h.kind}{h.dbroot ? ` · ${h.dbroot}` : ""}
                      </Breadcrumb>
                      <Title>{h.label}</Title>
                      {h.snippet && h.snippet !== h.label && <Snippet>{h.snippet}</Snippet>}
                    </ResultCard>
                  ))}
                </ResultList>
              )}
            </GroupBox>
          </Section>

          <Section>
            <GroupBox label="Explorer">
              <p style={{ fontSize: FONT.body, margin: 0 }}>
                Every DbRoot, every table, every row on iqlabs — one tree view.
              </p>
              <div style={{ marginTop: 10 }}>
                <Link href="/table" style={{ textDecoration: "none" }}>
                  <Button>Go to /table</Button>
                </Link>
              </div>
            </GroupBox>
          </Section>

          <Section>
            <GroupBox label="How identifiers route">
              <p style={{ fontSize: FONT.body, margin: 0 }}>
                Paste any Solana identifier in the URL and the resolver decides
                where it belongs:
              </p>
              <ul style={{ fontSize: FONT.body, margin: "8px 0 0 18px", padding: 0, lineHeight: 1.7 }}>
                <li>
                  <Mono>browser.iqlabs.dev/zo.sol</Mono> — SNS name resolves to a
                  wallet → profile view.
                </li>
                <li>
                  <Mono>browser.iqlabs.dev/myapp.sol</Mono> — SNS name pointing
                  at an iqpages deployment → the proxy serves the site in place,
                  URL stays the same.
                </li>
                <li>
                  <Mono>browser.iqlabs.dev/{`{pubkey}`}</Mono> — wallet, table
                  PDA, or git repo address. The resolver dispatches by shape.
                </li>
                <li>
                  <Mono>browser.iqlabs.dev/{`{txSignature}`}</Mono> — transaction
                  lookup (coming soon).
                </li>
              </ul>
            </GroupBox>
          </Section>

          <Section>
            <GroupBox label="What works now">
              <ul style={{ fontSize: FONT.body, margin: "0 0 0 18px", padding: 0, lineHeight: 1.7 }}>
                <li>SNS + pubkey resolver with dispatch by shape</li>
                <li>iqpages proxy — deployed sites stay on the original URL</li>
                <li>Git repo redirect to <Mono>git.iqlabs.dev</Mono></li>
                <li>Table explorer — DbRoots, tables, rows, in-browser payload viewer</li>
                <li>Legacy DbRoot label recovery (keccak + sha256)</li>
              </ul>
            </GroupBox>
          </Section>
        </WindowContent>
      </Shell>
    </Page>
  );
}
