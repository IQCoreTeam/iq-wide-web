"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  Button,
  ScrollView,
  Tab,
  Tabs,
  Window,
  WindowContent,
  WindowHeader,
} from "react95";
import { HOODCHAN_URL } from "@/lib/constants";
import type { ChainNetwork } from "@/resolver/types";
import { FONT } from "@/lib/ui/typography";
import { InventoryTab } from "./inventory-tab";
import { IqChanTab } from "./iqchan-tab";
import { IqGitTab } from "./iqgit-tab";
import { LookupWindow } from "./lookup-window";
import { SolChatTab } from "./solchat-tab";
import { UnofficialAppsDropdown } from "./unofficial-apps-dropdown";

type TabKey = "inventory" | "solchat" | "iqchan" | "iqgit" | "unofficial";

// Which apps each chain actually has today. Solana shows everything. Robinhood
// shows only what it supports: Inventory (hood-in inscriptions, read live) and
// HoodChan (the BlockChan sibling). SolChat / IQ GitHub / Unofficial have no
// Robinhood equivalent yet, so they are hidden there (porting tracked in issues).
const TABS_BY_NETWORK: Record<ChainNetwork, TabKey[]> = {
  solana: ["inventory", "solchat", "iqchan", "iqgit", "unofficial"],
  robinhood: ["inventory", "iqchan"],
};

// iqchan is labelled per chain: BlockChan on Solana, HoodChan on Robinhood.
function tabLabel(key: TabKey, network: ChainNetwork): string {
  if (key === "iqchan") return network === "robinhood" ? "HoodChan" : "BlockChan";
  return { inventory: "Inventory", solchat: "SolChat", iqgit: "IQ GitHub", unofficial: "Unofficial" }[key] ?? key;
}

const Column = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/** 모바일에선 탭 라벨("IQ GitHub", "Unofficial")이 두 줄로 깨지므로
 *  Tab 내부 폰트를 축소하고 패딩을 줄여 한 줄로 유지. react95 Tab은
 *  내부적으로 button 으로 렌더되므로 그 element 를 직접 겨냥한다. */
const CompactTabs = styled(Tabs)`
  /* The body below is a react95 ScrollView (position: relative), not a TabBody,
   * so it paints over the selected tab's -6px bottom overlap and the active tab
   * looks clipped by the body's top border. Fix: lift the tab row into its own
   * positioned layer (z-index) AND keep that overlap from being clipped by the
   * horizontal scroller. overflow-x: auto forces overflow-y to auto, which would
   * clip the -6px, so hold it inside 6px of bottom padding and pull the body
   * back up with a matching negative margin (no gap, no clip). */
  position: relative;
  z-index: 1;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: -6px;
  @media (max-width: 640px) {
    button {
      font-size: ${FONT.meta}px;
      padding: 0 8px;
    }
  }
`;

const TabsBody = styled.div`
  padding: 12px;
  font-size: ${FONT.body}px;
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 16px;
  min-height: 220px;
  text-align: center;
`;

/** HoodChan has no per-wallet reader in the browser yet (EVM board posts are not
 *  in /user/assets, so listing them needs a who-filtered feed scan — tracked as
 *  a porting issue). Until then, hand off to hoodchan.xyz. */
function HoodChanSoon() {
  return (
    <Center>
      <p style={{ margin: 0, fontSize: FONT.heading, fontWeight: 700 }}>HoodChan</p>
      <p style={{ margin: 0, fontSize: FONT.body, opacity: 0.75, maxWidth: 320 }}>
        This wallet&apos;s HoodChan posts are coming to the browser. For now, open HoodChan directly.
      </p>
      <Button onClick={() => window.open(HOODCHAN_URL, "_blank", "noopener,noreferrer")}>
        Open HoodChan →
      </Button>
    </Center>
  );
}

/** Right-column apps surface. Identical on / and /[wallet]; the chain of the
 *  viewed wallet (`network`) decides which apps show. */
export function AppPanel({ walletAddress, network = "solana" }: { walletAddress: string; network?: ChainNetwork }) {
  const tabs = TABS_BY_NETWORK[network];
  const [tab, setTab] = useState<TabKey>(tabs[0]);
  const active = tabs.includes(tab) ? tab : tabs[0];

  return (
    <Column>
      <LookupWindow />

      <Window style={{ width: "100%" }}>
        <WindowHeader><span>apps.exe</span></WindowHeader>
        <WindowContent style={{ padding: 8, display: "flex", flexDirection: "column", gap: 0 }}>
          <CompactTabs value={active} onChange={(v) => setTab(v as TabKey)}>
            {tabs.map((key) => <Tab key={key} value={key}>{tabLabel(key, network)}</Tab>)}
          </CompactTabs>
          <ScrollView style={{ height: 300 }}>
            <TabsBody>
              {active === "inventory" && <InventoryTab walletAddress={walletAddress} network={network} />}
              {active === "solchat" && <SolChatTab walletAddress={walletAddress} />}
              {active === "iqchan" && (network === "robinhood"
                ? <HoodChanSoon />
                : <IqChanTab walletAddress={walletAddress} />)}
              {active === "iqgit" && <IqGitTab walletAddress={walletAddress} />}
              {active === "unofficial" && <UnofficialAppsDropdown />}
            </TabsBody>
          </ScrollView>
        </WindowContent>
      </Window>
    </Column>
  );
}
