"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, GroupBox, ProgressBar, TextInput, Window, WindowContent, WindowHeader } from "react95";
import type { ProfileMeta } from "@/lib/profile/profile";
import { SOCIAL_PLATFORMS, type SocialKey } from "@/lib/profile/socials";
import { useProfileEditor } from "@/lib/profile/use-profile-editor";
import { FONT } from "@/lib/ui/typography";
import { SocialsDialog } from "./socials-dialog";

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${FONT.body}px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Chips = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.li`
  font-size: ${FONT.meta}px;
  padding: 2px 8px;
  background: ${({ theme }) => theme.material};
  border: 1px solid ${({ theme }) => theme.borderDark};
  word-break: break-all;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const ErrorText = styled.p`
  color: #b00020;
  font-size: ${FONT.body}px;
  margin: 0;
`;

export function ProfileEditor({
  initial,
  onClose,
}: {
  initial: ProfileMeta | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [profilePicture, setProfilePicture] = useState(initial?.profilePicture ?? "");
  const [socials, setSocials] = useState<Partial<Record<SocialKey, string>>>(
    initial?.socials ?? {},
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate, isPending, error } = useProfileEditor();

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!isPending) {
      setProgress(0);
      return;
    }
    const id = setInterval(() => setProgress((p) => (p + 8) % 100), 120);
    return () => clearInterval(id);
  }, [isPending]);

  const save = () => {
    mutate(
      {
        name: name.trim(),
        bio: bio.trim() || undefined,
        profilePicture: profilePicture.trim() || undefined,
        socials: Object.keys(socials).length > 0 ? socials : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  const disabled = isPending || !name.trim();

  return (
    <Window style={{ width: "100%" }}>
      <WindowHeader>
        <span>edit profile</span>
      </WindowHeader>
      <WindowContent>
        <Content>
          <GroupBox label="Profile">
            <Section>
              <Field>
                <span>Name</span>
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={64}
                  placeholder="zo"
                  fullWidth
                />
              </Field>

              <Field>
                <span>Bio</span>
                <TextInput
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  multiline
                  rows={3}
                  maxLength={280}
                  placeholder="tell people who you are"
                  fullWidth
                />
              </Field>

              <Field>
                <span>Profile picture URL</span>
                <TextInput
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="https://… or txId"
                  fullWidth
                />
              </Field>
            </Section>
          </GroupBox>

          <GroupBox label="Socials">
            {Object.keys(socials).length === 0 ? (
              <p style={{ fontSize: FONT.body, opacity: 0.7, margin: 0 }}>
                No socials added.
              </p>
            ) : (
              <Chips>
                {SOCIAL_PLATFORMS.filter((p) => socials[p.key]).map((p) => (
                  <Chip key={p.key}>
                    <strong>{p.label}</strong>: {socials[p.key]}
                  </Chip>
                ))}
              </Chips>
            )}
            <div style={{ marginTop: 8 }}>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                {Object.keys(socials).length === 0 ? "+ Add social" : "Edit socials"}
              </Button>
            </div>
          </GroupBox>

          {isPending && (
            <GroupBox label="Saving to chain…">
              <ProgressBar variant="tile" value={progress} />
            </GroupBox>
          )}

          {error && (
            <ErrorText>
              {error instanceof Error ? error.message : String(error)}
            </ErrorText>
          )}

          <Row>
            <Button onClick={save} disabled={disabled} primary>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </Row>
        </Content>
      </WindowContent>

      <SocialsDialog
        open={dialogOpen}
        initial={socials}
        onClose={() => setDialogOpen(false)}
        onSave={setSocials}
      />
    </Window>
  );
}
