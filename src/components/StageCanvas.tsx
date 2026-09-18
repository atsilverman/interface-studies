import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LayoutGroup } from "motion/react";
import { useViewport } from "../lib/viewport";

export function StageCanvas({ children }: { children: ReactNode }) {
  const { layout, narrow, frameWidth } = useViewport();
  const hostRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const mobile = layout === "mobile";
  const phoneStage = mobile && narrow;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const content = contentRef.current;
    if (!host || !content) return;

    const measure = () => {
      if (phoneStage) {
        setScale(1);
        return;
      }
      const width = host.clientWidth;
      const height = host.clientHeight;
      const contentW = Math.max(content.scrollWidth, content.offsetWidth, mobile ? 400 : frameWidth);
      const contentH = Math.max(content.scrollHeight, content.offsetHeight);
      const next = Math.min((width - 24) / contentW, (height - 24) / contentH, 1);
      setScale(Number.isFinite(next) && next > 0 ? Math.max(0.34, next) : 1);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, [frameWidth, mobile, phoneStage]);

  return (
    <div
      ref={hostRef}
      className={
        phoneStage
          ? "h-full min-h-0 w-full overflow-auto"
          : "flex h-full min-h-0 w-full items-center justify-center overflow-hidden"
      }
    >
      <div
        className={
          phoneStage
            ? "flex min-h-full w-full items-center justify-center px-4 pt-6 pb-28"
            : mobile
              ? "flex w-full max-w-[400px] flex-col items-center px-4 py-6"
              : "flex w-max flex-col items-center"
        }
        style={{ zoom: phoneStage ? 1 : scale }}
      >
        <LayoutGroup id="stage">
          <div
            ref={contentRef}
            className={`flex flex-col items-center [&_*:not(input):not(textarea):not(button)]:cursor-default ${
              mobile ? "w-full max-w-[400px]" : "w-max"
            }`}
          >
            {children}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
