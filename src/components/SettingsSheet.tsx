import { useRef, useState } from "react";
import { Baby, X } from "lucide-react";
import { setAvatar, setBabyName } from "@/lib/settings";
import { toAvatarDataUrl } from "@/lib/image";
import {
  getEmoji,
  getRole,
  setEmoji,
  setRole,
  toSingleEmoji,
  EMOJI_MAX_LENGTH,
  ROLE_MAX_LENGTH,
} from "@/lib/role";
import { useSheetScrollLock } from "@/hooks/useSheetScrollLock";

export function SettingsSheet({
  babyName,
  avatar,
  onClose,
}: {
  babyName: string;
  avatar: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(babyName);
  const [role, setRoleDraft] = useState(getRole());
  const [emoji, setEmojiDraft] = useState(getEmoji());
  // null means "untouched" — distinct from "" , which means the photo was
  // removed and the stored one needs clearing on save.
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useSheetScrollLock<HTMLDivElement>();
  const shownAvatar = avatarDraft ?? avatar;

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again after a Remove still
    // fires a change event.
    e.target.value = "";
    if (!file) return;
    try {
      setAvatarDraft(await toAvatarDataUrl(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function save() {
    setBusy(true);
    try {
      // Role is local-only and can't fail; the name is a network write, so
      // only it needs the busy state.
      setRole(role);
      setEmoji(emoji);
      if (avatarDraft !== null) await setAvatar(avatarDraft);
      await setBabyName(name || "Baby");
      onClose();
    } catch (err) {
      setBusy(false);
      alert(`Couldn't save settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Baby's name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Baby"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white outline-none focus:border-indigo-400"
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-slate-400">
            Baby's avatar
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 ring-1 ring-slate-700">
                {shownAvatar ? (
                  <img src={shownAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Baby className="h-7 w-7 text-slate-600" />
                )}
              </span>
              <div className="flex flex-col items-start gap-1">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300"
                >
                  {shownAvatar ? "Change photo" : "Add photo"}
                </button>
                {shownAvatar && (
                  <button onClick={() => setAvatarDraft("")} className="px-1 text-sm text-slate-500">
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm text-slate-400">
            Your role
            <div className="flex gap-2">
              {/* The emoji stands in for a photo of you: iOS web push always
                  shows the app's own icon and ignores a per-notification one,
                  so a picture can't reach the notification — but text can. */}
              <input
                value={emoji}
                onChange={(e) => setEmojiDraft(toSingleEmoji(e.target.value))}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={EMOJI_MAX_LENGTH}
                aria-label="Your emoji"
                placeholder="🙂"
                className="w-14 shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-center text-base text-white outline-none focus:border-indigo-400"
              />
              <input
                value={role}
                onChange={(e) => setRoleDraft(e.target.value)}
                maxLength={ROLE_MAX_LENGTH}
                placeholder="Dad, Mom, Grandma…"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white outline-none focus:border-indigo-400"
              />
            </div>
            <span className="text-xs text-slate-500">
              Added to notifications so the other phone sees who logged it. Saved on this
              device only — each phone sets its own.
            </span>
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-indigo-500 py-3 font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
