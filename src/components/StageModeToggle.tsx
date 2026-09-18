import { LayoutGroup, motion } from "motion/react";
import { springs } from "../lib/tokens";
import { useViewport, type StageLayout } from "../lib/viewport";

function MonitorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1.25" y="2" width="12.5" height="8.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 12.5h5M7.5 10.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="4" y="1.25" width="7" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 11.75h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function StageModeToggle() {
  const { mode, layout, setMode } = useViewport();

  const pick = (next: StageLayout) => {
    if (mode !== "auto" && layout === next) setMode("auto");
    else setMode(next);
  };

  return (
    <LayoutGroup id="stage-mode">
      <div className="flex items-center rounded-full bg-zinc-100 p-0.5" role="group" aria-label="Stage layout">
        <button
          type="button"
          aria-label="Desktop layout"
          aria-pressed={layout === "desktop"}
          onClick={() => pick("desktop")}
          className={`relative flex size-8 items-center justify-center rounded-full ${
            layout === "desktop" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {layout === "desktop" ? (
            <motion.span
              layoutId="stage-mode-thumb"
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={springs.soft}
            />
          ) : null}
          <span className="relative z-10">
            <MonitorIcon />
          </span>
        </button>
        <button
          type="button"
          aria-label="Mobile layout"
          aria-pressed={layout === "mobile"}
          onClick={() => pick("mobile")}
          className={`relative flex size-8 items-center justify-center rounded-full ${
            layout === "mobile" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {layout === "mobile" ? (
            <motion.span
              layoutId="stage-mode-thumb"
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={springs.soft}
            />
          ) : null}
          <span className="relative z-10">
            <PhoneIcon />
          </span>
        </button>
      </div>
    </LayoutGroup>
  );
}
