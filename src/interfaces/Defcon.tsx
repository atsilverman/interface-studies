import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StageCard } from "../components/StageCard";
import { StageMorph } from "../components/StageMorph";
import { useStageDock } from "../lib/stage-dock";
import { springs } from "../lib/tokens";
import { useViewport } from "../lib/viewport";

const THRESHOLD = 10;
const MATCH_END = 90;
const SPEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const MS_PER_MINUTE_AT_1X = 280;

const EVENTS = [
  { m: 4.1, kind: "Clr" as const },
  { m: 6.8, kind: "Tkl" as const },
  { m: 8.2, kind: "Int" as const },
  { m: 19.4, kind: "Blk" as const },
  { m: 31.0, kind: "Clr" as const },
  { m: 32.7, kind: "Tkl" as const },
  { m: 48.6, kind: "Int" as const },
  { m: 51.9, kind: "Clr" as const },
  { m: 61.2, kind: "Tkl" as const },
  { m: 67.4, kind: "Blk" as const },
  { m: 78.3, kind: "Clr" as const },
  { m: 84.8, kind: "Int" as const },
];

function formatMinute(minute: number) {
  const whole = Math.min(MATCH_END, Math.floor(minute));
  const seconds = Math.min(59, Math.floor((minute % 1) * 60));
  return `${whole}:${String(seconds).padStart(2, "0")}`;
}

function LiveDot() {
  return (
    <motion.span
      aria-hidden="true"
      className="size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [1, 0.28, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function Defcon() {
  const { layout } = useViewport();
  const compact = layout === "mobile";
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [minute, setMinute] = useState(0);
  const minuteRef = useRef(0);

  const actions = useMemo(() => EVENTS.filter((event) => event.m <= minute), [minute]);
  const count = actions.length;
  const last = actions.at(-1);
  const achieved = count >= THRESHOLD;
  const fill = Math.min(1, count / THRESHOLD);

  useEffect(() => {
    if (!running) return;
    let lastTick = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = now - lastTick;
      lastTick = now;
      const next = Math.min(MATCH_END, minuteRef.current + (delta * speed) / MS_PER_MINUTE_AT_1X);
      minuteRef.current = next;
      setMinute(next);
      if (next >= MATCH_END) {
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed]);

  const reset = () => {
    setRunning(false);
    minuteRef.current = 0;
    setMinute(0);
  };

  const toggle = () => {
    if (minuteRef.current >= MATCH_END) {
      minuteRef.current = 0;
      setMinute(0);
    }
    setRunning((value) => !value);
  };

  useStageDock({
    playing: running,
    onToggle: toggle,
    onReset: reset,
    speed,
    speeds: SPEEDS,
    onSpeed: (value) => setSpeed(value as (typeof SPEEDS)[number]),
  });

  return (
    <StageCard
      wide
      title="Defcon"
      meta="CB · 10"
      badge={
        running ? (
          <>
            <LiveDot />
            Live
          </>
        ) : achieved ? (
          "Hit"
        ) : (
          "Kickoff"
        )
      }
      badgeTone={running ? "live" : achieved ? "hit" : "default"}
      footer="FPL defensive contributions. Ten CBIT for a defender"
    >
      <div className={compact ? "px-4 pt-4 pb-4" : "px-5 pt-4 pb-4"}>
        <div className={compact ? "mb-4 flex flex-col gap-3" : "mb-4 flex items-start justify-between gap-3"}>
          <StageMorph id="defcon-player">
            <p className="text-[15px] font-medium tracking-tight text-zinc-900">William Saliba</p>
            <p className="text-[12px] tracking-tight text-zinc-400">Arsenal · vs Brighton</p>
          </StageMorph>
          <StageMorph id="defcon-clock" className={compact ? "flex items-baseline gap-2" : "text-right"}>
            <motion.p
              className="font-mono tracking-tighter text-zinc-900 tabular-nums"
              animate={{ fontSize: compact ? 22 : 18 }}
              transition={springs.soft}
            >
              {formatMinute(minute)}
            </motion.p>
            <p className="text-[11px] tracking-tight text-zinc-400">minutes</p>
          </StageMorph>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={count}
              initial={count > 0 ? { y: 6, opacity: 0.45, scale: 0.94 } : undefined}
              animate={{ y: 0, opacity: 1, scale: achieved ? 1.04 : 1 }}
              transition={achieved ? springs.stamp : springs.snappy}
              className={`font-mono text-[28px] tracking-tighter tabular-nums ${
                achieved ? "text-emerald-600" : "text-zinc-900"
              }`}
            >
              {count}
            </motion.span>
            <span className="font-mono text-[13px] text-zinc-400">/ {THRESHOLD}</span>
          </div>
          <AnimatePresence mode="wait">
            {last ? (
              <motion.span
                key={`${last.m}-${last.kind}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={springs.snappy}
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-tight ${
                  achieved ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500"
                }`}
              >
                {Math.floor(last.m)}' · {last.kind}
              </motion.span>
            ) : (
              <span className="text-[11px] tracking-tight text-zinc-400">Waiting first action</span>
            )}
          </AnimatePresence>
        </div>

        <div className="relative mb-4 h-2.5 overflow-hidden rounded-full bg-zinc-100">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${achieved ? "bg-emerald-500" : "bg-zinc-900"}`}
            animate={{ width: `${fill * 100}%` }}
            transition={springs.soft}
          />
          <div className="pointer-events-none absolute inset-0 flex">
            {Array.from({ length: THRESHOLD - 1 }, (_, i) => (
              <span key={i} className="flex-1 border-r border-white/70" />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {achieved ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springs.stamp}
              className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] tracking-tight text-emerald-800"
            >
              Defensive contribution unlocked · 2 FPL pts
            </motion.p>
          ) : null}
        </AnimatePresence>

        <p className="text-[12px] tracking-tight text-zinc-400">
          {minute >= MATCH_END ? (
            "Full time"
          ) : running ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <LiveDot />
              Match clock running
            </span>
          ) : (
            "Kick off when ready"
          )}
        </p>
      </div>
    </StageCard>
  );
}
