import { LayoutGroup, motion } from "motion/react";
import { Monitor, Smartphone } from "lucide-react";
import { springs } from "../lib/tokens";
import { useViewport, type StageLayout } from "../lib/viewport";

const icon = { size: 15, strokeWidth: 1.75, "aria-hidden": true } as const;

export function StageModeToggle({ className = "" }: { className?: string }) {
  const { mode, layout, setMode } = useViewport();

  const pick = (next: StageLayout) => {
    if (mode !== "auto" && layout === next) setMode("auto");
    else setMode(next);
  };

  return (
    <LayoutGroup id="stage-mode">
      <div
        className={`flex shrink-0 items-center rounded-full p-0.5 ${className || "bg-zinc-100"}`}
        role="group"
        aria-label="Stage layout"
      >
        <button
          type="button"
          aria-label="Desktop layout"
          aria-pressed={layout === "desktop"}
          onClick={() => pick("desktop")}
          className={`relative flex size-9 items-center justify-center rounded-full ${
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
            <Monitor {...icon} />
          </span>
        </button>
        <button
          type="button"
          aria-label="Mobile layout"
          aria-pressed={layout === "mobile"}
          onClick={() => pick("mobile")}
          className={`relative flex size-9 items-center justify-center rounded-full ${
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
            <Smartphone {...icon} />
          </span>
        </button>
      </div>
    </LayoutGroup>
  );
}
