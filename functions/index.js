// Fans out a push notification to every registered device except the one
// that made the write, whenever a new entry is logged — but only while the
// shared settings/app.notificationsEnabled flag is on.
//
// Called directly by the client (an HTTPS callable) right after it saves an
// entry, rather than triggered off the Firestore write via Eventarc — the
// event-trigger path proved unreliable to deploy and near-impossible to
// debug when it silently stopped delivering events. A direct call fails
// loudly and immediately instead.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const FAMILY_EMAIL = "timka@team.family";
const REGION = "europe-central2";
// A device not touched (app opened while notifications are on) in this long
// is treated as abandoned — e.g. from reinstalling the PWA, which resets the
// old install's local storage and orphans its device doc with no way for
// the client to reach back and delete it directly. Self-heals instead of
// needing manual cleanup in the Firestore console.
const STALE_DEVICE_MS = 3 * 24 * 60 * 60 * 1000;

function describeEntry(entry) {
  const isRange = entry.type === "sleep" || entry.type === "awake";
  const done = isRange && entry.endTime != null;

  if (entry.type === "sleep") {
    const label = entry.sleepType === "overnight" ? "Overnight sleep" : "Nap";
    return done ? `${label} logged` : `${label} started`;
  }
  if (entry.type === "awake") {
    return done ? "Awake time logged" : "Awake started";
  }
  if (entry.type === "feed") {
    const label = entry.feedType === "breastmilk" ? "Breastmilk" : "Formula";
    const amount = entry.amount ? ` (${entry.amount}${entry.amountUnit ?? ""})` : "";
    return `${label} logged${amount}`;
  }
  if (entry.type === "supplement") {
    const label = entry.supplementType === "iron" ? "Iron" : "Vitamin D";
    return `${label} logged`;
  }
  if (entry.type === "diaper") {
    return entry.diaperType === "poopy" ? "Poopy diaper logged" : "Wet diaper logged";
  }
  return "New entry logged";
}

exports.notifyOnNewEntry = onCall({ region: REGION }, async (request) => {
  if (request.auth?.token?.email !== FAMILY_EMAIL) {
    throw new HttpsError("permission-denied", "Not authorized.");
  }

  const entry = request.data;
  if (!entry || typeof entry !== "object") {
    throw new HttpsError("invalid-argument", "Missing entry data.");
  }

  const settingsSnap = await db.doc("settings/app").get();
  if (settingsSnap.data()?.notificationsEnabled !== true) return { sent: 0 };

  const devicesSnap = await db.collection("devices").get();
  const now = Date.now();
  const abandoned = [];
  const tokens = [];
  for (const d of devicesSnap.docs) {
    const data = d.data();
    if (data.deviceId === entry.deviceId) continue;
    const lastSeenMs = (data.lastSeen ?? data.createdAt)?.toMillis?.() ?? 0;
    if (now - lastSeenMs > STALE_DEVICE_MS) abandoned.push(d.ref);
    else tokens.push(d.id);
  }
  await Promise.all(abandoned.map((ref) => ref.delete()));
  if (tokens.length === 0) return { sent: 0 };

  const response = await messaging.sendEachForMulticast({
    tokens,
    // Title is the actual message, not "Team Baby" — iOS already shows its
    // own "from Team Baby" attribution line for web-push notifications, so
    // repeating the app name as the title just duplicated it.
    notification: { title: describeEntry(entry) },
    // The service worker displays nothing itself (see the comment there), so
    // presentation has to come from the message — the SDK's own auto-display
    // reads these.
    webpush: { notification: { icon: "/icon-192.png", badge: "/icon-192.png" } },
  });

  const stale = response.responses
    .map((r, i) => (!r.success && r.error?.code === "messaging/registration-token-not-registered" ? tokens[i] : null))
    .filter(Boolean);
  await Promise.all(stale.map((t) => db.collection("devices").doc(t).delete()));

  if (response.failureCount > 0) {
    logger.warn(`${response.failureCount} of ${tokens.length} pushes failed`, {
      errors: response.responses.filter((r) => !r.success).map((r) => r.error?.message),
    });
  }

  return { sent: response.successCount };
});
