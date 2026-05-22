"use client";

import styled from "styled-components";

/**
 * Desktop-fixed width container that still relaxes on narrow screens.
 * Pages use this to get the "Window centered on the desktop" look.
 *
 * Why a styled component instead of inline styles: responsive breakpoints
 * live in media queries, which inline `style` can't express. One shared
 * component keeps the breakpoint consistent across pages.
 */
export const PageContainer = styled.main`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  /* 콘텐츠가 뷰포트보다 짧으면 세로 중앙, 길면 자연스럽게 위부터 흐름 */
  min-height: 100vh;
  justify-content: center;

  @media (max-width: 640px) {
    padding: 8px;
    gap: 12px;
  }
`;

/** Stack for children with a consistent gap. The profile grid nests two
 *  of these (profile window + app-panel window). */
export const Stack = styled.div<{ gap?: number; direction?: "row" | "column" }>`
  display: flex;
  flex-direction: ${(p) => p.direction ?? "column"};
  gap: ${(p) => p.gap ?? 12}px;
  width: 100%;
`;

/** Two-column grid that collapses to one column on mobile. Used by the
 *  profile page. */
export const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

/** Window that fills its grid slot but caps at a readable width. */
export const SectionWindow = styled.div`
  width: 100%;
  max-width: 560px;
`;
