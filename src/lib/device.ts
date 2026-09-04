const KEY = "team-baby-device-id";

/** A random id identifying this browser install — not a person, just a
 * device, so the notification fan-out can skip pushing back to whichever
 * device made the write. */
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
