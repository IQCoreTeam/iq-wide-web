// Hard-monochrome phosphor-terminal theme. Strictly two colors:
//   - pure black (#000) for every surface
//   - phosphor green (#00ff41) for every border, text, caret, checkmark
//
// Win95 theme fields are 30+, so we reduce them to role-specific brightness
// ramps (`#001a08` = just-visible dark green for things that need to be
// slightly darker than pure black, e.g. flat variants). No gray, no
// "raised bezel" illusions — windows look like hand-drawn 1px outlines
// which reads closer to a Windows 1.0 / DOS TUI than to Win95 chrome.

import type { Theme } from "react95/dist/themes/types";

const INK = "#00ff41";         // phosphor green — borders, text
const INK_DIM = "#00b32d";     // secondary text
const INK_FAINT = "#005418";   // disabled text / shadow echoes
const PAPER = "#000000";       // every surface
const PAPER_LIFTED = "#001a08"; // 1 step brighter for hover / flat panels

const greenCRT: Theme = {
  name: "greenCRT",

  // Links — keep high contrast even inside black canvases.
  anchor: INK,
  anchorVisited: INK_DIM,

  // Borders are the single UI feature that separates widgets. Use ink for
  // the outer edge, fainter greens for inner bevel stops so react95's
  // 4-line bevel still renders without turning into a gray Win95 look.
  borderDark: INK_FAINT,
  borderDarkest: PAPER,
  borderLight: INK_DIM,
  borderLightest: INK,

  // Canvas (inside text inputs, ScrollView, TextInput).
  canvas: PAPER,
  canvasText: INK,
  canvasTextDisabled: INK_FAINT,
  canvasTextDisabledShadow: PAPER,
  canvasTextInvert: PAPER,

  // Checkbox / radio indicators.
  checkmark: INK,
  checkmarkDisabled: INK_FAINT,

  // Body background.
  desktopBackground: PAPER,

  // "Flat" variant buttons (menu / toolbar) — slightly lifted paper so the
  // hover state has somewhere to go.
  flatDark: PAPER_LIFTED,
  flatLight: PAPER,

  focusSecondary: INK_DIM,

  // Title bar — inverted. A solid ink bar with black text reads as the
  // focused row in a DOS list, which is the closest thing to a Win1 title.
  headerBackground: INK,
  headerNotActiveBackground: PAPER_LIFTED,
  headerNotActiveText: INK_DIM,
  headerText: PAPER,

  hoverBackground: INK,

  // `material` is the Win95 gray. We black it out and rely on borders
  // for visual separation.
  material: PAPER,
  materialDark: PAPER_LIFTED,
  materialText: INK,
  materialTextDisabled: INK_FAINT,
  materialTextDisabledShadow: PAPER,
  materialTextInvert: PAPER,

  progress: INK,

  tooltip: PAPER_LIFTED,
};

export default greenCRT;
