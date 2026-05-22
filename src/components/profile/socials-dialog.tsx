"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Tab, TabBody, Tabs, TextInput, Window, WindowContent, WindowHeader } from "react95";
import { SOCIAL_PLATFORMS, type SocialKey } from "@/lib/profile/socials";
import { FONT } from "@/lib/ui/typography";

type SocialsDraft = Partial<Record<SocialKey, string>>;

const PUBLIC_KEYS: SocialKey[] = ["twitter", "github", "website", "linkedin", "telegram"];
const CONTACT_KEYS: SocialKey[] = ["discord", "email"];

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
`;

const DialogWindow = styled(Window)`
  width: min(440px, 100%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
`;

const ScrollBody = styled.div`
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${FONT.body}px;
`;

const Footer = styled.div`
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid ${({ theme }) => theme.borderDark};
`;

const Description = styled.p`
  font-size: ${FONT.meta}px;
  opacity: 0.75;
  margin: 0;
`;

function PlatformFields({
  keys,
  draft,
  onChange,
}: {
  keys: SocialKey[];
  draft: SocialsDraft;
  onChange: (k: SocialKey, v: string) => void;
}) {
  return (
    <>
      {SOCIAL_PLATFORMS.filter((p) => keys.includes(p.key)).map((p) => (
        <Field key={p.key}>
          <span>{p.label}</span>
          <TextInput
            value={draft[p.key] ?? ""}
            onChange={(e) => onChange(p.key, e.target.value)}
            placeholder={p.placeholder}
            fullWidth
          />
        </Field>
      ))}
    </>
  );
}

export function SocialsDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: SocialsDraft;
  onClose: () => void;
  onSave: (socials: SocialsDraft) => void;
}) {
  const [draft, setDraft] = useState<SocialsDraft>(initial);
  const [tab, setTab] = useState<0 | 1>(0);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  if (!open) return null;

  const update = (key: SocialKey, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    const cleaned: SocialsDraft = {};
    for (const { key } of SOCIAL_PLATFORMS) {
      const v = draft[key]?.trim();
      if (v) cleaned[key] = v;
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <Backdrop onClick={onClose}>
      <DialogWindow onClick={(e) => e.stopPropagation()}>
        <WindowHeader>
          <span>socials</span>
        </WindowHeader>
        <WindowContent style={{ padding: 8, display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
          <Tabs value={tab} onChange={(v) => setTab(v as 0 | 1)}>
            <Tab value={0}>Public</Tab>
            <Tab value={1}>Contact</Tab>
          </Tabs>
          <TabBody style={{ flex: 1, padding: 0 }}>
            <ScrollBody>
              <Description>
                Fill in the ones you want. Empty fields are dropped on save.
              </Description>
              {tab === 0 && (
                <PlatformFields keys={PUBLIC_KEYS} draft={draft} onChange={update} />
              )}
              {tab === 1 && (
                <PlatformFields keys={CONTACT_KEYS} draft={draft} onChange={update} />
              )}
            </ScrollBody>
          </TabBody>
        </WindowContent>
        <Footer>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={save} primary>Save</Button>
        </Footer>
      </DialogWindow>
    </Backdrop>
  );
}
