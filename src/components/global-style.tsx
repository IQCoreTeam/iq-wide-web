"use client";

import { createGlobalStyle, css } from "styled-components";
import { createScrollbars, styleReset } from "react95";

// Theme is read from the styled-components ThemeProvider. Used here to
// paint the desktop background and set the body font. No overlay effects
// — the look comes from color + font alone.
export const GlobalStyle = createGlobalStyle`
  ${styleReset}

  /* Unifont — bundled under public/fonts. Covers a huge Unicode range
   * (CJK + glyphs) with a pixel look, which matches the terminal vibe. */
  @font-face {
    font-family: 'unifont';
    src: url('/fonts/unifont.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  @font-face {
    font-family: 'ms_sans_serif';
    src: url('https://unpkg.com/react95/dist/fonts/ms_sans_serif.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('https://unpkg.com/react95/dist/fonts/ms_sans_serif_bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  body {
    font-family: 'unifont', monospace;
    font-size: 16px;
    background: ${({ theme }) => theme.desktopBackground};
    color: ${({ theme }) => theme.materialText};
  }

  /* react95 components hardcode font-family: ms_sans_serif inside their
   * styled rules, which overrides body. Force unifont on every element so
   * monospace wallet addresses and react95 chrome share the same face. */
  *, button, input, textarea, select {
    font-family: 'unifont', monospace !important;
  }

  /* Title bars + inverted ink bars — the halo washes the black text out,
   * so we kill the shadow whenever text sits on a solid phosphor
   * background. Matches any react95 header / toolbar class. */
  [class*='WindowHeader'],
  [class*='WindowHeader'] *,
  [class*='Header_'],
  [class*='Header_'] *,
  [class*='ActiveTitle'],
  [class*='ActiveTitle'] * {
    text-shadow: none !important;
  }

  a {
    color: ${({ theme }) => theme.anchor};
    text-decoration: underline;
  }
  a:visited {
    color: ${({ theme }) => theme.anchorVisited};
  }

  /* react95-styled scrollbars on every overflowing element — hatched track,
   * windowed thumb with border, chunky arrow buttons. Applied globally so
   * plain divs with overflow:auto inherit the same look as ScrollView. */
  ${css`${createScrollbars()}`}

  /* windows1 테마는 material/borderLightest가 둘 다 흰색이라 react95
   * 기본 해치 트랙이 "흰색 on 흰색"으로 완전 사라짐. 스크롤바 트랙만
   * 눈에 보이는 Win95 도트 패턴(밝은 회색 + 흰색)으로 강제한다. */
  ::-webkit-scrollbar-track {
    background-color: #c0c0c0 !important;
    background-image: linear-gradient(
      45deg,
      #808080 25%,
      transparent 25%,
      transparent 75%,
      #808080 75%
    ),
    linear-gradient(
      45deg,
      #808080 25%,
      transparent 25%,
      transparent 75%,
      #808080 75%
    ) !important;
    background-size: 4px 4px !important;
    background-position: 0 0, 2px 2px !important;
  }
`;
