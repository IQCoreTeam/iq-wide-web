"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

/**
 * Collects styled-components CSS generated during the server render and
 * flushes it into the HTML <head> so the browser doesn't FOUC on hydration.
 * Required for styled-components v6 with Next App Router (RSC support is
 * still partial on v6.4).
 *
 * On the client we skip the sheet entirely — styled-components handles
 * subsequent renders itself.
 */
export function StyledRegistry({ children }: { children: React.ReactNode }) {
  const [sheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return <StyleSheetManager sheet={sheet.instance}>{children}</StyleSheetManager>;
}
