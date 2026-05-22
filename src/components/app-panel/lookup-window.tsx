"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  Button,
  GroupBox,
  TextInput,
  Window,
  WindowContent,
  WindowHeader,
} from "react95";
import { PublicKey } from "@solana/web3.js";

const LookupBody = styled.div`
  padding: 16px;
`;

const SearchRow = styled.form`
  display: flex;
  gap: 8px;
  width: 100%;
`;

function isPubkey(s: string): boolean {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

/** `lookup.exe` window — search by wallet address. Available both when
 *  a user is signed in (inside AppPanel) and before sign-in (home page,
 *  so visitors can jump to any profile without connecting). */
export function LookupWindow({ label = "Look up another wallet" }: { label?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (isPubkey(q)) router.push(`/${q}`);
  };

  return (
    <Window style={{ width: "100%" }}>
      <WindowHeader><span>lookup.exe</span></WindowHeader>
      <WindowContent>
        <LookupBody>
          <GroupBox label={label}>
            <SearchRow onSubmit={submit}>
              <TextInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Wallet address…"
                fullWidth
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" disabled={!isPubkey(search.trim())} primary>
                Go
              </Button>
            </SearchRow>
          </GroupBox>
        </LookupBody>
      </WindowContent>
    </Window>
  );
}
