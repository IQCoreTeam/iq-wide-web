"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  ScrollView,
  Tab,
  Tabs,
  Window,
  WindowContent,
  WindowHeader,
} from "react95";
import { FONT } from "@/lib/ui/typography";
import { IqChanTab } from "./iqchan-tab";
import { IqGitTab } from "./iqgit-tab";
import { LookupWindow } from "./lookup-window";
import { SolChatTab } from "./solchat-tab";
import { UnofficialAppsDropdown } from "./unofficial-apps-dropdown";

type TabKey = "solchat" | "iqchan" | "iqgit" | "unofficial";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/** 모바일에선 탭 라벨("IQ GitHub", "Unofficial")이 두 줄로 깨지므로
 *  Tab 내부 폰트를 축소하고 패딩을 줄여 한 줄로 유지. react95 Tab은
 *  내부적으로 button 으로 렌더되므로 그 element 를 직접 겨냥한다. */
const CompactTabs = styled(Tabs)`
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

const Placeholder = styled.p`
  margin: 0;
  opacity: 0.7;
`;

/** Right-column apps surface. Identical on / and /[wallet] — only the
 *  `walletAddress` prop differs (own wallet vs. viewed wallet). */
export function AppPanel({ walletAddress }: { walletAddress: string }) {
  const [tab, setTab] = useState<TabKey>("iqchan");

  return (
    <Column>
      <LookupWindow />

      <Window style={{ width: "100%" }}>
        <WindowHeader><span>apps.exe</span></WindowHeader>
        <WindowContent style={{ padding: 8, display: "flex", flexDirection: "column", gap: 0 }}>
          <CompactTabs value={tab} onChange={(v) => setTab(v as TabKey)}>
            <Tab value="solchat">SolChat</Tab>
            <Tab value="iqchan">BlockChan</Tab>
            <Tab value="iqgit">IQ GitHub</Tab>
            <Tab value="unofficial">Unofficial</Tab>
          </CompactTabs>
          <ScrollView style={{ height: 300 }}>
            <TabsBody>
              {tab === "solchat" && <SolChatTab walletAddress={walletAddress} />}
              {tab === "iqchan" && <IqChanTab walletAddress={walletAddress} />}
              {tab === "iqgit" && <IqGitTab walletAddress={walletAddress} />}
              {tab === "unofficial" && <UnofficialAppsDropdown walletAddress={walletAddress} />}
            </TabsBody>
          </ScrollView>
        </WindowContent>
      </Window>
    </Column>
  );
}
