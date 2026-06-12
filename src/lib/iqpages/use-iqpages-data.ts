"use client";

// IQ Pages data hooks. Only the gallery-list query runs on page load. Opening a
// deployment is just a browser.iqlabs.dev/<commit-pda> link (built in the
// dropdown), so no per-click commit/tree resolution is needed here.

import { useQuery } from "@tanstack/react-query";
import {
  listAllDeployments,
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
