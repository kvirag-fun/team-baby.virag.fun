const ROLE_KEY = "team-baby-role";
const EMOJI_KEY = "team-baby-emoji";

export const ROLE_MAX_LENGTH = 24;
// Long enough for the multi-codepoint ones — a skin-toned, gendered emoji
// like 👨🏻‍🦰 is already seven UTF-16 units, and family emoji are longer.
export const EMOJI_MAX_LENGTH = 12;

/** What the person using this phone calls themselves — "Dad", "Mom",
 * "Grandma" — and an emoji standing in for their face. Free text on
 * purpose: the point is that it reads naturally in a notification, not that
 * it's one of a fixed set.
 *
 * The emoji is the closest thing to a personal avatar that survives the trip
 * to a phone: iOS web push ignores a per-notification icon entirely and
 * always shows the app's own manifest icon, so a picture can't appear there,
 * but text (emoji included) comes through fine.
 *
 * Both are stored per browser install rather than shared in Firestore,
 * because they describe whoever holds *this* phone, not the family. Both
 * phones sign into the same account today, so there is nothing else to hang
 * them off — and even once logins are split, they still belong to the
 * install. They reset on reinstall, same as the device id beside them. */
export function getRole(): string {
  return localStorage.getItem(ROLE_KEY) ?? "";
}

export function setRole(role: string) {
  write(ROLE_KEY, role, ROLE_MAX_LENGTH);
}

export function getEmoji(): string {
  return localStorage.getItem(EMOJI_KEY) ?? "";
}

export function setEmoji(emoji: string) {
  write(EMOJI_KEY, toSingleEmoji(emoji), EMOJI_MAX_LENGTH);
}

// Extended_Pictographic covers the pictorial emoji; Regional_Indicator is
// what flags are made of, and the enclosing keycap is what turns a digit
// into 1️⃣ — none of those three match each other.
const EMOJI_CHAR = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u{20E3}/u;

/** Reduces whatever was typed to a single emoji, dropping ordinary text.
 *
 * Splitting on grapheme clusters rather than characters is what keeps a
 * multi-codepoint emoji in one piece — 👨🏻‍🦰 and 🇭🇺 are each several
 * codepoints joined together, and slicing them apart yields nonsense. The
 * *last* emoji wins so that typing a new one replaces the old rather than
 * being ignored until the field is cleared by hand. */
export function toSingleEmoji(value: string): string {
  if (!value) return "";
  const clusters =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment)
      : Array.from(value);
  return clusters.filter((c) => EMOJI_CHAR.test(c)).pop() ?? "";
}

function write(key: string, value: string, max: number) {
  const trimmed = value.trim().slice(0, max);
  if (trimmed) localStorage.setItem(key, trimmed);
  else localStorage.removeItem(key);
}
