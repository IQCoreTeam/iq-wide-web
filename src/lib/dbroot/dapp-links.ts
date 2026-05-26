// Map a row from /table/{pda}/rows back to the dApp page that originally
// rendered it. Each dApp has its own URL convention; we look at the DbRoot
// label (resolved or raw) + the table hint to decide where the row "lives".
//
// When we can't construct a row-specific link, we fall back to the dApp's
// home page where possible. When even that doesn't make sense, return null
// and the explorer simply won't show a "view in" button.

export interface DAppLink {
  /** Display name for the button, e.g. "view on blockchan" */
  label: string;
  /** Absolute URL to open in a new tab */
  href: string;
}

interface ResolveCtx {
  /** dbroot label, resolved if it was a legacy hash, else raw utf-8 */
  dbrootLabel: string | null;
  /** table hint label (utf-8 if printable, else null) */
  tableLabel: string | null;
  /** the row as the gateway returns it */
  row: Record<string, unknown>;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** iqchan — hash routing on blockchan.sol.site/#/{boardId}/{threadPda}
 *  Board id comes from the threadSeed prefix ("iq/thread/..." -> "iq").
 *  If we only know the board (no threadPda), link to the board page. */
function iqchanLink({ tableLabel, row }: ResolveCtx): DAppLink | null {
  const threadSeed = str(row.threadSeed);
  const threadPda = str(row.threadPda);

  // Thread post — has both threadSeed and threadPda
  if (threadSeed && threadPda) {
    const boardId = threadSeed.split("/")[0];
    return {
      label: "view on blockchan",
      href: `https://blockchan.sol.site/#/${boardId}/${threadPda}`,
    };
  }

  // Board table row (no thread context) — open the board page
  if (tableLabel && !tableLabel.includes("/")) {
    return {
      label: "view on blockchan",
      href: `https://blockchan.sol.site/#/${tableLabel}`,
    };
  }

  return null;
}

/** moltchat / clawbal-iqlabs — ai.iqlabs.dev/chat?room={tableLabel}&msg={txSig}
 *  Table is the chatroom name. tx sig deep-links the message. */
function moltchatLink({ tableLabel, row }: ResolveCtx): DAppLink | null {
  if (!tableLabel) return null;
  const txSig = str(row.__txSignature);
  const params = new URLSearchParams({ room: tableLabel });
  if (txSig) params.set("msg", txSig);
  return {
    label: "view on clawbal",
    href: `https://ai.iqlabs.dev/chat?${params.toString()}`,
  };
}

/** on-chaingit — git.iqlabs.dev/{owner}/{repo}
 *  Table seed is "git_commits:OWNER:REPO". No commit-detail page exists, so
 *  every row in that table links to the repo. */
function iqgitLink({ tableLabel }: ResolveCtx): DAppLink | null {
  if (!tableLabel?.startsWith("git_commits:")) return null;
  const parts = tableLabel.split(":");
  if (parts.length !== 3) return null;
  const [, owner, repo] = parts;
  return {
    label: "view on iq git",
    href: `https://git.iqlabs.dev/${owner}/${repo}`,
  };
}

/** solchat — chat.iqlabs.dev. Room selection is state-based, no deep-link, so
 *  every row from this dbroot just opens the chat app. */
function solchatLink(): DAppLink {
  return { label: "open solchat", href: "https://chat.iqlabs.dev/chat" };
}

export function resolveDAppLink(ctx: ResolveCtx): DAppLink | null {
  const root = ctx.dbrootLabel;
  if (!root) return null;

  switch (root) {
    case "iqchan":
      return iqchanLink(ctx);
    case "clawbal-iqlabs":
    case "clawbal":
    case "clawbal-chat":
    case "clawbal-root":
      return moltchatLink(ctx);
    case "iq-git-v1":
      return iqgitLink(ctx);
    case "solchat":
    case "solchat-root":
      return solchatLink();
    default:
      return null;
  }
}
