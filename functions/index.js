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
// Bumped on every deploy while debugging propagation — lets us confirm from
// the client which revision actually answered a call.
const CODE_VERSION = "diag-4";

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
  if (settingsSnap.data()?.notificationsEnabled !== true) {
    return {
      sent: 0,
      version: CODE_VERSION,
      reason: "notificationsEnabled is not true",
      notificationsEnabled: settingsSnap.data()?.notificationsEnabled ?? null,
    };
  }

  const devicesSnap = await db.collection("devices").get();
  const deviceIds = devicesSnap.docs.map((d) => d.data().deviceId);
  const tokens = devicesSnap.docs.filter((d) => d.data().deviceId !== entry.deviceId).map((d) => d.id);
  if (tokens.length === 0) {
    return {
      sent: 0,
      version: CODE_VERSION,
      reason: "no other registered devices",
      callerDeviceId: entry.deviceId,
      registeredDeviceIds: deviceIds,
      registeredCount: devicesSnap.size,
    };
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: "Team Baby", body: describeEntry(entry) },
  });

  const stale = response.responses
    .map((r, i) => (!r.success && r.error?.code === "messaging/registration-token-not-registered" ? tokens[i] : null))
    .filter(Boolean);
  await Promise.all(stale.map((t) => db.collection("devices").doc(t).delete()));

  const errors = response.responses
    .map((r, i) => (r.success ? null : { token: tokens[i].slice(0, 12) + "…", code: r.error?.code, message: r.error?.message }))
    .filter(Boolean);
  if (errors.length > 0) {
    logger.warn(`${errors.length} of ${tokens.length} pushes failed`, { errors });
  }

  return { sent: response.successCount, attempted: tokens.length, version: CODE_VERSION, errors };
});
