// Single source of truth for social platforms. The editor, the dialog,
// and the profile card all read from this array so ordering, labels,
// placeholders, and URL shape stay in sync.
//
// Storage convention: values are stored as full URLs (what you'd paste in
// a browser). The placeholder doubles as the canonical example. `toUrl`
// is identity for web links and a mailto: wrapper for email. Discord has
// no public profile URL so it renders as plain text.

export type SocialKey =
  | "twitter"
  | "github"
  | "website"
  | "linkedin"
  | "telegram"
  | "discord"
  | "email";

export interface SocialPlatform {
  key: SocialKey;
  label: string;
  placeholder: string;
  /** Convert a stored value into a clickable href, or null if un-linkable. */
  toUrl: (value: string) => string | null;
}

const asIs = (v: string): string => v;

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "twitter",
    label: "Twitter / X",
    placeholder: "https://x.com/Im_zo_sol",
    toUrl: asIs,
  },
  {
    key: "github",
    label: "GitHub",
    placeholder: "https://github.com/zo",
    toUrl: asIs,
  },
  {
    key: "website",
    label: "Website",
    placeholder: "https://example.com",
    toUrl: asIs,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/zo",
    toUrl: asIs,
  },
  {
    key: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/Im_zo_sol",
    toUrl: asIs,
  },
  {
    key: "discord",
    label: "Discord",
    placeholder: "Im_zo_sol",
    toUrl: () => null,
  },
  {
    key: "email",
    label: "Email",
    placeholder: "zo@example.com",
    toUrl: (v) => `mailto:${v}`,
  },
];

/** Drop empty / whitespace-only values so stored JSON only keeps filled fields. */
export function compactSocials(
  socials: Partial<Record<SocialKey, string>>,
): Partial<Record<SocialKey, string>> | undefined {
  const out: Partial<Record<SocialKey, string>> = {};
  for (const { key } of SOCIAL_PLATFORMS) {
    const v = socials[key]?.trim();
    if (v) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
