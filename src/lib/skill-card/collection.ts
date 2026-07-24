// The AgentNet COLLECTION card: the umbrella art for the skills / workflows
// Token-2022 groups. Same 64x32 terminal grid as the item cards, but the face
// is just the big ASCII wordmark (SKILL / WORKFLOW) plus the collection mint.
// Everything is a constant of the collection type, so the PNG is immutable.
import { wordmark } from "./blockLetters";
import { renderGrid } from "./text";
import { COLS, ROWS } from "./card";

const INDENT = "   ";
const INNER = COLS - INDENT.length * 2;

const COPY: Record<"skill" | "workflow", { mark: string; blurb: string[] }> = {
  skill: {
    mark: "SKILL",
    blurb: [
      "The AgentNet skills collection. Every member is a",
      "soulbound Token-2022 item: a skill an agent can equip,",
      "with its full content inscribed on Solana.",
    ],
  },
  workflow: {
    mark: "WORKFLOW",
    blurb: [
      "The AgentNet workflows collection. Every member is a",
      "soulbound Token-2022 bundle of skills with on-chain",
      "gates, inscribed on Solana.",
    ],
  },
};

export function collectionCardLines(type: "skill" | "workflow", mint: string): string[] {
  const { mark, blurb } = COPY[type];
  const rule = INDENT + "─".repeat(INNER);
  const wm = wordmark(mark);
  const lines: string[] = ["╔" + "═".repeat(COLS - 2) + "╗", "", "", ""];
  if (wm) lines.push(INDENT + wm[0], INDENT + wm[1]);
  else lines.push(INDENT + mark, "");
  lines.push("", rule, "");
  lines.push(INDENT + `[ AGENTNET / ${type.toUpperCase()} COLLECTION ]`, "");
  lines.push(...blurb.map((l) => INDENT + l));
  lines.push("", INDENT + `collection  ${mint.slice(0, 4)}..${mint.slice(-4)}`);
  const foot = [
    rule,
    "",
    INDENT + "soulbound  token-2022  solana mainnet" +
      " ".repeat(Math.max(1, COLS - INDENT.length - 37 - 8)) + "AGENTNET",
    "",
    "╚" + "═".repeat(COLS - 2) + "╝",
  ];
  while (lines.length + foot.length < ROWS) lines.push("");
  return [...lines.slice(0, ROWS - foot.length), ...foot];
}

export function renderCollectionCard(type: "skill" | "workflow", mint: string): Buffer {
  return renderGrid(collectionCardLines(type, mint), { cols: COLS, rows: ROWS, scale: 2 });
}
