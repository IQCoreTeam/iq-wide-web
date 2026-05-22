"use client";

import styled from "styled-components";
import { Frame, Toolbar } from "react95";

const Strip = styled(Frame).attrs({ variant: "well" })`
  width: 100%;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export function TopBar({ children }: { children: React.ReactNode }) {
  return (
    <Strip>
      <Toolbar noPadding style={{ width: "100%", justifyContent: "space-between" }}>
        {children}
      </Toolbar>
    </Strip>
  );
}
