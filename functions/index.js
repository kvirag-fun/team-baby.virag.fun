// Fans out a push notification to every registered device except the one
// that made the write, whenever a new entry is logged — but only while the
// shared settings/app.notificationsEnabled flag is on.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

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

exports.notifyOnNewEntry = onDocumentCreated("entries/{entryId}", async (event) => {
  const entry = event.data?.data();
  if (!entry) return;

  const settingsSnap = await db.doc("settings/app").get();
  if (settingsSnap.data()?.notificationsEnabled !== true) return;

  const devicesSnap = await db.collection("devices").get();
  const tokens = devicesSnap.docs.filter((d) => d.data().deviceId !== entry.deviceId).map((d) => d.id);
  if (tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: "Team Baby", body: describeEntry(entry) },
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
});
