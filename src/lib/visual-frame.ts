import { useEffect, useState } from "react";

export function useVisualFrame(active: boolean) {
  const [frame, setFrame] = useState(() => ({
    top: 0,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
    inset: 0,
  }));

  useEffect(() => {
    if (!active) return;

    const sync = () => {
      const view = window.visualViewport;
      const height = view?.height ?? window.innerHeight;
      const top = view?.offsetTop ?? 0;
      setFrame({
        top,
        height,
        inset: Math.max(0, window.innerHeight - height - top),
      });
    };

    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [active]);

  return frame;
}
