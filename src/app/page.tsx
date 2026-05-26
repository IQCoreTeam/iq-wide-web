"use client";

// Home is a tiny README — what this thing is, where it lives, and what already
// works. The Google-style search bar is shown disabled (coming soon); for now
// the working entry point is the table explorer.

import Link from "next/link";
import styled from "styled-components";
import { Button, GroupBox, TextInput, Window, WindowContent, WindowHeader } from "react95";
import { FONT } from "@/lib/ui/typography";

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

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export default function HomePage() {
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
              <SearchRow>
                <TextInput
                  placeholder="search the on-chain web — coming soon"
                  disabled
                  style={{ flex: 1 }}
                />
                <Button disabled>Search</Button>
              </SearchRow>
              <p style={{ fontSize: FONT.meta, marginTop: 8, opacity: 0.7 }}>
                Future: type anything. Identifier-shaped input (.sol / pubkey /
                tx sig) routes via the resolver; everything else hits the
                gateway-wide catalog. Until then, use the explorer below.
              </p>
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
