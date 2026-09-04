const AVATAR_PX = 256;
const AVATAR_QUALITY = 0.82;
// Firestore's own limit is ~1 MiB per document. This is a long way below it
// on purpose: the resize below should land near 15 KB, so anything past this
// means something went wrong rather than the photo merely being large.
const MAX_BYTES = 400_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

/** Centre-crops a picked photo to a square and re-encodes it small enough to
 * store in a Firestore document. All of it happens on the device; the
 * full-size original never leaves the phone.
 *
 * Drawing an <img> (rather than an ImageBitmap) is deliberate: browsers
 * apply a photo's EXIF orientation when rendering an <img>, so pictures
 * taken sideways on a phone come out the right way up without reading the
 * EXIF ourselves. */
export async function toAvatarDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error("That image appears to be empty.");

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PX;
  canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser wouldn't give us a canvas to resize with.");
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_PX,
    AVATAR_PX,
  );

  const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
  if (dataUrl.length > MAX_BYTES) throw new Error("That photo came out too large to save.");
  return dataUrl;
}
