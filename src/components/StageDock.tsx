import { AnimatePresence, motion } from "motion/react";
import { IconButton, PauseIcon, PlayIcon, ResetIcon } from "./IconButton";
import { useStageDockState } from "../lib/stage-dock";
import { springs } from "../lib/tokens";
import { useViewport } from "../lib/viewport";

export function StageDock() {
  const { dock } = useStageDockState();
  const { layout } = useViewport();
  const compact = layout === "mobile";

  return (
    <AnimatePresence>
      {dock ? (
        <motion.div
          layout="position"
          layoutDependency={layout}
          role="toolbar"
          aria-label="Stage playback"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, borderRadius: compact ? 16 : 999 }}
          exit={{ opacity: 0, y: 6 }}
          transition={springs.soft}
          className={`mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-zinc-100 px-3 py-2 ${
            compact ? "w-full rounded-2xl" : "rounded-full"
          }`}
        >
          {dock.speeds.length > 0 && dock.onSpeed ? (
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {dock.speeds.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => dock.onSpeed?.(value)}
                  className={`min-w-8 rounded-full px-2 font-mono text-[11px] tracking-tight transition-colors ${
                    compact ? "h-8" : "h-7"
                  } ${dock.speed === value ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-800"}`}
                >
                  {value}×
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <IconButton label="Reset" onClick={dock.onReset} className={compact ? "size-10" : ""}>
              <ResetIcon />
            </IconButton>
            <IconButton label={dock.playing ? "Pause" : "Play"} filled onClick={dock.onToggle} className={compact ? "size-10" : ""}>
              {dock.playing ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
