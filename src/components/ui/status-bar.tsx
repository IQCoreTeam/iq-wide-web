"use client";

import styled from "styled-components";
import { Frame } from "react95";
import { FONT } from "@/lib/ui/typography";

const Bar = styled(Frame).attrs({ variant: "well" })`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  font-size: ${FONT.meta}px;
  opacity: 0.9;
`;

const Cell = styled(Frame).attrs({ variant: "status" })`
  padding: 2px 8px;
  min-width: 80px;
`;

const Spacer = styled.div`
  flex: 1;
`;

export function StatusBar({ cells }: { cells: React.ReactNode[] }) {
  return (
    <Bar>
      {cells.map((c, i) => (
        <Cell key={i}>{c}</Cell>
      ))}
      <Spacer />
    </Bar>
  );
}
