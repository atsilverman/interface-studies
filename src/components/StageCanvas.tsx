import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LayoutGroup } from "motion/react";
import { useViewport } from "../lib/viewport";

export function StageCanvas({ children }: { children: ReactNode }) {
  const { layout, narrow, frameWidth } = useViewport();
  const hostRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const mobile = layout === "mobile";
  const lockScale = mobile && narrow;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const content = contentRef.current;
    if (!host || !content) return;

    const measure = () => {
      if (lockScale) {
        setScale(1);
        return;
      }
      const width = host.clientWidth;
      const height = host.clientHeight;
      const contentW = Math.max(content.scrollWidth, content.offsetWidth, mobile ? 400 : frameWidth);
      const contentH = Math.max(content.scrollHeight, content.offsetHeight);
      const next = Math.min((width - 16) / contentW, (height - 16) / contentH, 1);
      setScale(Number.isFinite(next) && next > 0 ? Math.max(0.34, next) : 1);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, [frameWidth, lockScale, mobile]);

  return (
    <div
      ref={hostRef}
      className={`flex h-full min-h-0 w-full justify-center ${
        mobile ? `overflow-auto ${narrow ? "items-start" : "items-center"}` : "items-center overflow-hidden"
      }`}
    >
      <div
        className={
          mobile ? "flex w-full max-w-[400px] flex-col items-center px-4 py-6" : "flex w-max flex-col items-center"
        }
        style={{ zoom: lockScale ? 1 : scale }}
      >
        <LayoutGroup id="stage">
          <div
            ref={contentRef}
            className={`flex flex-col items-center [&_*:not(input):not(textarea):not(button)]:cursor-default ${
              mobile ? "w-full" : "w-max"
            }`}
          >
            {children}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
