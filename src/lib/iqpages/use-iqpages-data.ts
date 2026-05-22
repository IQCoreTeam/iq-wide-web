"use client";

// IQ Pages data hooks. Only the gallery-list query runs on page load.
// Everything else (commit, tree, iqpages.json, iqprofile.json) is fetched on
// demand from `resolveLaunchTarget` when the user clicks Open — keeps the
// dropdown's RPC cost at exactly one table read.

import { useQuery } from "@tanstack/react-query";
import { GATEWAY_URL } from "@/lib/constants";
import {
  listAllDeployments,
  resolveLaunchTarget,
  type Deployment,
  type IqpagesConfig,
  type IqprofileConfig,
  type LaunchTarget,
} from "./iqpages-service";

export type { Deployment, IqpagesConfig, IqprofileConfig, LaunchTarget };

/** All registered deployments. Single HTTP call to the gateway. */
export function useIqpagesList() {
  return useQuery<Deployment[]>({
    queryKey: ["iqpages", "list"],
    queryFn: () => listAllDeployments(),
    staleTime: 60_000,
  });
}

/** Resolve a launch target on click. React Query cache means repeat clicks
 *  on the same deployment within `staleTime` cost zero requests. */
export function useResolveLaunchTarget() {
  return async (owner: string, repo: string): Promise<LaunchTarget | null> =>
    resolveLaunchTarget(owner, repo);
}

/** Compose the live app URL.
 *
 *  - If the app declared `iqprofile.json` with `routes.profile`, point the
 *    user at that profile route with the viewed wallet substituted in.
 *  - Otherwise fall back to `iqpages.json#entry` (whatever the app picks as
 *    its root HTML — e.g. "gameboy.html"). Apps without `iqpages.json` get
 *    a plain `/site/{treeTxId}/` URL; the gateway resolves index.html.
 *
 *  Route shapes (chosen by the app):
 *    "?…" | "#…"        → query/hash appended to entry
 *    "/?…" | "/#…"      → same after trimming the leading slash
 *    "/segment/…"       → SPA path route, entry skipped (gateway SPA fallback)
 */
export function buildLaunchUrl(
  target: LaunchTarget,
  viewedWallet: string,
): string {
  const base = `${GATEWAY_URL}/site/${target.treeTxId}`;
  const route = target.profile?.routes?.profile;
  const entry = target.config?.entry?.replace(/^\//, "") ?? "";

  if (route) {
    const resolved = route.replace("{walletAddress}", viewedWallet);
    if (/^\/?[?#]/.test(resolved)) {
      const tail = resolved.replace(/^\//, "");
      return `${base}/${entry}${tail}`;
    }
    return `${base}${resolved.startsWith("/") ? resolved : `/${resolved}`}`;
  }

  return entry ? `${base}/${entry}` : base;
}
