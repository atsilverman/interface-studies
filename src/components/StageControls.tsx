import { motion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { springs } from "../lib/tokens";
import { useStageDockState } from "../lib/stage-dock";
import { IconButton } from "./IconButton";

const icon = { size: 15, strokeWidth: 1.75, "aria-hidden": true } as const;

export function StageControls({ className = "", framed = false }: { className?: string; framed?: boolean }) {
  const { dock } = useStageDockState();

  if (!dock) return null;

  const hit = framed ? "size-11" : "size-9";

  return (
    <motion.div
      role="toolbar"
      aria-label="Stage playback"
      initial={{ opacity: 0, x: framed ? -6 : 6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: framed ? -4 : 4 }}
      transition={springs.snappy}
      className={`flex items-center gap-1.5 ${framed ? "rounded-full bg-zinc-100/80 p-1.5 shadow-heavy backdrop-blur-md" : ""} ${className}`}
    >
      <IconButton label="Reset" hoverTone="reset" className={hit} onClick={dock.onReset}>
        <RotateCcw {...icon} />
      </IconButton>
      <IconButton
        label={dock.playing ? "Pause" : "Play"}
        filled
        hoverTone={dock.playing ? "pause" : "play"}
        className={hit}
        onClick={dock.onToggle}
      >
        {dock.playing ? <Pause {...icon} /> : <Play {...icon} />}
      </IconButton>
    </motion.div>
  );
}
