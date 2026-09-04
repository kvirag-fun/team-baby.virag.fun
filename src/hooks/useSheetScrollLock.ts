import { useEffect, useRef } from "react";

/** Stops the page behind an open sheet from scrolling.
 *
 * Deliberately does NOT pin the body with `position: fixed`, the usual
 * recipe: taking the body out of flow changes where the bottom safe-area
 * inset resolves, which showed up as a chunk of dead space under the sheet's
 * Save button on a phone.
 *
 * Instead the document keeps its layout and only the scrolling is blocked —
 * `overflow: hidden` for the general case, plus cancelling any touch drag
 * that didn't start inside the sheet's own scrollable panel, since iOS
 * scrolls the document regardless of `overflow`. Returns the ref to put on
 * that panel. */
export function useSheetScrollLock<T extends HTMLElement>() {
  const panelRef = useRef<T>(null);

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";

    function onTouchMove(e: TouchEvent) {
      const panel = panelRef.current;
      if (!panel || !panel.contains(e.target as Node)) e.preventDefault();
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      body.style.overflow = previous;
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return panelRef;
}
