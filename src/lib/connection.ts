import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "./firebase";

/** How long to wait for the canary before calling the connection dead. Long
 * enough for a slow mobile network, short enough that a genuinely wedged
 * connection is noticed while the app is still being looked at. */
const CANARY_TIMEOUT_MS = 5000;

/** The smallest, cheapest document in the project: one field-light settings
 * doc. What it contains doesn't matter — only whether the round-trip
 * completes. */
const canaryDoc = doc(db, "settings", "app");

let inFlight: Promise<boolean> | null = null;

/** One server read that answers "is the connection actually alive?".
 *
 * Firestore bills per document returned per listener, so rebuilding every
 * listener on every return to the foreground costs one read per entry, per
 * foreground — thousands a day once the log has a few hundred entries. This
 * is the cheap alternative: ask the server for a single document, and only
 * rebuild if that fails.
 *
 * Shared and de-duplicated across callers, because there are several
 * subscriptions and they all foreground at the same moment — without this it
 * would be one read each rather than one in total.
 *
 * A success is strong evidence rather than proof: it shows the transport
 * works, not that one particular listener's stream is healthy. Callers pair
 * it with their own "have I ever received a snapshot" check for that. */
export function checkConnection(): Promise<boolean> {
  if (!inFlight) {
    inFlight = Promise.race([
      getDocFromServer(canaryDoc).then(() => true),
      new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), CANARY_TIMEOUT_MS)),
    ])
      .catch(() => false)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
