import { useEffect } from "react";

/** Stops the page behind a sheet from scrolling while it's open, and puts the
 * page back exactly where it was on close.
 *
 * `overflow: hidden` on its own isn't enough — iOS Safari scrolls the
 * document anyway. Pinning the body with `position: fixed` does hold it, at
 * the cost of the page jumping to the top, so the current offset is carried
 * across as a negative `top` and restored with a scroll on the way out. */
export function useLockBodyScroll() {
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      Object.assign(body.style, previous);
      window.scrollTo(0, scrollY);
    };
  }, []);
}
