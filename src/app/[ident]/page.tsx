"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Window, WindowContent, WindowHeader } from "react95";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { AppPanel } from "@/components/app-panel/app-panel";
import { AppHeader } from "@/components/ui/app-header";
import { AppFooter } from "@/components/ui/app-footer";
import { PageContainer, ResponsiveGrid } from "@/components/ui/layout";
import { FONT } from "@/lib/ui/typography";
import { IQGIT_URL } from "@/lib/constants";
import { useIqpagesList } from "@/lib/iqpages/use-iqpages-data";
import { resolveLaunchTarget } from "@/lib/iqpages/iqpages-service";
import { useQuery } from "@tanstack/react-query";
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

// Matched a table PDA on a known DbRoot. Today only the git case is wired up;
// other dApps fall through to the dev belongs-to placeholder.
//
// iq-wide-web is open source — if you run a dApp and add a new DbRoot, please
// PR a case here so your tables render the way you want.
function DbRootMatch({ dbroot, hint }: { dbroot: DbRoot; hint: TableHint }) {
  // A git_commits commit-table hint always looks like "git_commits:OWNER:REPO".
  // Non-git matches drop straight to belongs-to.
  const gitParts = hint.label?.startsWith("git_commits:") ? hint.label.split(":") : null;
  if (gitParts && gitParts.length === 3) {
    return <GitMatch owner={gitParts[1]} repo={gitParts[2]} />;
  }

  const dApp = dbroot.id ?? dbroot.pda;
  const table = hint.label ?? hint.hex;
  return (
    <MessageWindow
      title="belongs to"
      body={`This address belongs to ${dApp} — table "${table}".`}
    />
  );
}

// A git repo: deployed-as-an-iqpages-site is the primary case — we render
// the site on our own host via the /site proxy. If it isn't deployed, we
// hand the visitor off to the git frontend. Deployment check is one cached
// list lookup; the launch target read happens only when deployed (it pulls
// the entry path + treeTxId).
function GitMatch({ owner, repo }: { owner: string; repo: string }) {
  const { data: deployments, isLoading: deploymentsLoading } = useIqpagesList();
  const deployed = deployments?.some((d) => d.owner === owner && d.repo === repo);

  const launch = useQuery({
    queryKey: ["launch-target", owner, repo],
    queryFn: () => resolveLaunchTarget(owner, repo),
    enabled: deployed === true,
    staleTime: 60_000,
  });

  const target =
    deployed && launch.data
      ? `/site/${launch.data.treeTxId}/${launch.data.config?.entry?.replace(/^\//, "") ?? ""}`
      : deployed === false
        ? `${IQGIT_URL}/${owner}/${repo}`
        : null;

  useEffect(() => {
    if (target) window.location.href = target;
  }, [target]);

  const status = deploymentsLoading
    ? "Looking up deployment status…"
    : deployed && !launch.data
      ? "Loading site…"
      : target
        ? `Sending you to ${target}`
        : "";
  return <MessageWindow title="git repo" body={status} />;
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
