"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import { FONT } from "@/lib/ui/typography";

/* ---------- Phase 1: Win 2.1 스타일 로고 ---------- */

const slideInLeft = keyframes`
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`;

const blink = keyframes`
  50% { opacity: 0; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
`;

const Phase = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
`;

const LogoScreen = styled(Phase)`
  background: #000;
  color: #00ff22;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 40px 24px;
`;

const LogoStage = styled.div`
  position: relative;
  width: min(360px, 60vw);
  aspect-ratio: 687 / 521;
`;

const STRIP_COUNT = 20;

/* 홀수 인덱스(0,2,4...)는 왼쪽에서, 짝수(1,3,5...)는 오른쪽에서
 * 동시에 한 번 들어와 교차 합체. stagger 없음. */
const LogoStrip = styled.div<{ $index: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $index }) => ($index * 100) / STRIP_COUNT}%;
  height: ${100 / STRIP_COUNT}%;
  overflow: hidden;
  animation: ${({ $index }) => ($index % 2 === 0 ? slideInLeft : slideInRight)}
    700ms cubic-bezier(0.25, 0.9, 0.3, 1) forwards;
  transform: translateX(${({ $index }) => ($index % 2 === 0 ? "-110%" : "110%")});
`;

const LogoStripInner = styled.div<{ $index: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $index }) => -$index * 100}%;
  height: ${STRIP_COUNT * 100}%;

  img {
    object-fit: contain;
  }
`;

const Meta = styled.div`
  text-align: center;
  font-size: 22px;
  line-height: 1.5;
  color: #fff;
`;

const Copyright = styled.div`
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  line-height: 1.6;
  color: #fff;
`;

/* ---------- Phase 2: BIOS 로그 ---------- */

const BiosScreen = styled(Phase)`
  background: #000;
  color: #c0c0c0;
  padding: 24px 32px;
  flex-direction: column;
  font-size: ${FONT.body}px;
  line-height: 1.45;
  letter-spacing: 0.5px;
`;

const BiosHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 8px;
`;

const BiosLines = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
`;

const StarMark = styled.div`
  width: min(180px, 22vw);
  flex-shrink: 0;
  opacity: 0.95;
`;

const PressKey = styled.div`
  margin-top: auto;
  padding-top: 24px;
`;

const Cursor = styled.span`
  display: inline-block;
  margin-left: 2px;
  animation: ${blink} 1s step-end infinite;
`;

const BIOS_LOG: string[] = [
  "IQLabs BIOS v0.1 — Solana Mainnet",
  "Copyright (C) 2026, IQLabs Protocol. All rights reserved.",
  "",
  "Program ID  JE4333 : 9KLLch...iQLabs      OK",
  "Cluster     mainnet-beta                  OK",
  "RPC         Helius                        OK",
  "",
  "IQSDK Extension  v1.3.2",
  "Copyright (C) 2026, IQLabs Protocol.",
  "   Detecting wallet adapter  ........... OK",
  "   Loading IQDB reader  ................ OK",
  "   Loading profile cache  .............. OK",
  "   Loading gateway relay  .............. OK",
];

const LOGO_DURATION = 1500;
const LINE_DELAY = 90;
const BIOS_FADE_IN = 250;
const POST_LOG_HOLD = 500;

export function BootSplash() {
  const [phase, setPhase] = useState<"logo" | "bios">("logo");
  const [gone, setGone] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    const toBios = setTimeout(() => setPhase("bios"), LOGO_DURATION);
    return () => clearTimeout(toBios);
  }, []);

  useEffect(() => {
    if (phase !== "bios") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= BIOS_LOG.length; i++) {
      timers.push(
        setTimeout(() => setLineCount(i), BIOS_FADE_IN + i * LINE_DELAY),
      );
    }

    const totalLogTime = BIOS_FADE_IN + BIOS_LOG.length * LINE_DELAY;
    timers.push(setTimeout(() => setGone(true), totalLogTime + POST_LOG_HOLD));

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (gone) return null;

  return (
    <Overlay aria-hidden>
      <LogoScreen $visible={phase === "logo"}>
        <LogoStage>
          {Array.from({ length: STRIP_COUNT }, (_, i) => (
            <LogoStrip key={i} $index={i}>
              <LogoStripInner $index={i}>
                <Image src="/iq_logo.svg" alt="" fill priority />
              </LogoStripInner>
            </LogoStrip>
          ))}
        </LogoStage>
        <Meta>IQ Profile Net Version 0.1</Meta>
        <Copyright>
          Copyright (c) IQLabs, 2026. All Rights Reserved.
          <br />
          IQLabs Protocol on Solana
        </Copyright>
      </LogoScreen>

      <BiosScreen $visible={phase === "bios"}>
        <BiosHeader>
          <BiosLines>{BIOS_LOG.slice(0, lineCount).join("\n")}</BiosLines>
          <StarMark>
            <Image
              src="/solana_internet.png"
              alt=""
              width={360}
              height={220}
              priority
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          </StarMark>
        </BiosHeader>

        {lineCount >= BIOS_LOG.length && (
          <PressKey>
            Press any key to continue<Cursor>_</Cursor>
          </PressKey>
        )}
      </BiosScreen>
    </Overlay>
  );
}
