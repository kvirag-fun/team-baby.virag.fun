const KEY = "team-baby-role";

/** What the person using this phone calls themselves — "Dad", "Mom",
 * "Grandma". Free text on purpose: the point is that it reads naturally in
 * a notification, not that it's one of a fixed set.
 *
 * Stored per browser install rather than shared in Firestore, because it
 * describes whoever holds *this* phone, not the family. Both phones sign
 * into the same account today, so there is nothing else to hang it off —
 * and even once logins are split, a role still belongs to the install, not
 * to the shared settings doc. Resets on reinstall, same as the device id
 * it sits beside. */
export function getRole(): string {
  return localStorage.getItem(KEY) ?? "";
}

export function setRole(role: string) {
  const trimmed = role.trim().slice(0, ROLE_MAX_LENGTH);
  if (trimmed) localStorage.setItem(KEY, trimmed);
  else localStorage.removeItem(KEY);
}

export const ROLE_MAX_LENGTH = 24;
