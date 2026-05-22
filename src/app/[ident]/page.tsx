"use client";

import { useParams } from "next/navigation";
import { Window, WindowContent, WindowHeader } from "react95";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { AppPanel } from "@/components/app-panel/app-panel";
import { AppHeader } from "@/components/ui/app-header";
import { AppFooter } from "@/components/ui/app-footer";
import { PageContainer, ResponsiveGrid } from "@/components/ui/layout";
import { FONT } from "@/lib/ui/typography";
import { useResolve } from "@/resolver/use-resolve";
import type { DbRoot, TableHint } from "@/resolver/types";

function MessageWindow({ title, body, color }: { title: string; body: string; color?: string }) {
  return (
    <PageContainer>
      <AppHeader showBack />
      <Window style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <WindowHeader><span>{title}</span></WindowHeader>
        <WindowContent>
          <p style={{ padding: 16, margin: 0, fontSize: FONT.body, color: color ?? "inherit" }}>
            {body}
          </p>
        </WindowContent>
      </Window>
      <AppFooter />
    </PageContainer>
  );
}

// Matched a table PDA on a known DbRoot.
//
// This is where dApp-specific rendering will go once we build it:
//  - git_commits hint registered on iqpages → load the pages site via the
//    gateway site endpoint and render it
//  - git_commits hint, not on iqpages → redirect to the git frontend, or iframe
//  - other dApps → their own view
//
// For now we just surface what we resolved (dev belongs-to view).
//
// iq-wide-web is open source — if you run a dApp and add a new DbRoot, please
// PR a case here so your tables render the way you want.
function DbRootMatch({ dbroot, hint }: { dbroot: DbRoot; hint: TableHint }) {
  const dApp = dbroot.id ?? dbroot.pda;
  const table = hint.label ?? hint.hex;
  return (
    <MessageWindow
      title="belongs to"
      body={`This address belongs to ${dApp} — table "${table}".`}
    />
  );
}

export default function IdentPage() {
  const params = useParams<{ ident: string }>();
  const ident = params?.ident ?? "";
  const { data: resolved, isLoading } = useResolve(ident);

  if (isLoading || !resolved) {
    return <MessageWindow title="resolving…" body={`Looking up ${ident}`} />;
  }

  switch (resolved.kind) {
    case "dbroot-table":
      return <DbRootMatch dbroot={resolved.dbroot} hint={resolved.hint} />;

    case "tx":
      return (
        <MessageWindow
          title="tx signature — coming soon"
          body="Transaction views are on the way. For now, look up wallets directly by address."
        />
      );

    case "not-found":
      return <MessageWindow title="404" body={`Nothing found for ${ident}.`} color="#b00020" />;

    case "wallet":
      return (
        <PageContainer>
          <AppHeader showBack />
          <ResponsiveGrid>
            <ProfilePanel walletAddress={resolved.pubkey} />
            <AppPanel walletAddress={resolved.pubkey} />
          </ResponsiveGrid>
          <AppFooter viewing={resolved.pubkey} />
        </PageContainer>
      );
  }
}
