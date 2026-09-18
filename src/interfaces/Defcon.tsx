import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useParams } from "react-router-dom";
import { StageCard } from "../components/StageCard";
import { StageMorph } from "../components/StageMorph";
import { useStageDock } from "../lib/stage-dock";
import { springs } from "../lib/tokens";
import { useViewport } from "../lib/viewport";

const THRESHOLD = 10;
const MATCH_END = 90;
const MS_PER_MINUTE = 280;

const KINDS = {
  Tkl: { label: "Tackle", swatch: "bg-zinc-900", chip: "bg-zinc-100 text-zinc-600" },
  Clr: { label: "Clearance", swatch: "bg-sky-600", chip: "bg-sky-50 text-sky-700" },
  Int: { label: "Interception", swatch: "bg-emerald-600", chip: "bg-emerald-50 text-emerald-700" },
  Blk: { label: "Block", swatch: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
} as const;

type ActionKind = keyof typeof KINDS;

const KIND_ORDER: ActionKind[] = ["Tkl", "Clr", "Int", "Blk"];

const TILT = 4;
const DRAG_ARM = 8;
const tiltSpring = { stiffness: 240, damping: 28, mass: 0.9 };

function shadowForTilt(rx: number, ry: number) {
  const x = -ry * 0.7;
  const y = rx * 0.55;
  const n = (value: number) => value.toFixed(2);
  return [
    `${n(x)}px ${n(1 + y)}px 1px 0.5px #2929290a`,
    `${n(x)}px ${n(3 + y)}px 3px -1.5px #29292905`,
    `${n(x)}px ${n(6 + y)}px 6px -3px #2929290a`,
    `${n(x * 1.1)}px ${n(12 + y)}px 12px -6px #2929290a`,
    `${n(x * 1.2)}px ${n(24 + y)}px 24px -12px #2929290a`,
    `${n(x * 1.35)}px ${n(48 + y)}px 48px -24px #2929290a`,
    `0 0 0 1px #2929290a`,
    `inset 0 -1px 1px -0.5px #3333330f`,
  ].join(", ");
}

const EVENTS: { m: number; kind: ActionKind }[] = [
  { m: 4.1, kind: "Clr" },
  { m: 6.8, kind: "Tkl" },
  { m: 8.2, kind: "Int" },
  { m: 19.4, kind: "Blk" },
  { m: 31.0, kind: "Clr" },
  { m: 32.7, kind: "Tkl" },
  { m: 48.6, kind: "Int" },
  { m: 51.9, kind: "Clr" },
  { m: 61.2, kind: "Tkl" },
  { m: 67.4, kind: "Blk" },
  { m: 78.3, kind: "Clr" },
  { m: 84.8, kind: "Int" },
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
  const { slug } = useParams();
  const morph = slug ?? "defcon";
  const { layout } = useViewport();
  const compact = layout === "mobile";
  const [running, setRunning] = useState(false);
  const [minute, setMinute] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [fineHover, setFineHover] = useState(true);
  const minuteRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springRx = useSpring(rx, tiltSpring);
  const springRy = useSpring(ry, tiltSpring);
  const cardShadow = useTransform([springRx, springRy], (values: unknown) => {
    const pair = Array.isArray(values) ? values : [0, 0];
    return shadowForTilt(Number(pair[0] ?? 0), Number(pair[1] ?? 0));
  });

  const actions = useMemo(() => EVENTS.filter((event) => event.m <= minute), [minute]);
  const legend = useMemo(() => {
    const present = new Set(actions.map((event) => event.kind));
    return KIND_ORDER.filter((kind) => present.has(kind));
  }, [actions]);
  const count = actions.length;
  const last = actions.at(-1);
  const achieved = count >= THRESHOLD;
  const fill = Math.min(1, count / THRESHOLD);
  const canReveal = minute > 0 && count > 0;
  const showTimeline = inspect && canReveal;

  const pressToInspect = compact || !fineHover;

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFineHover(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!running) return;
    let lastTick = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = now - lastTick;
      lastTick = now;
      const next = Math.min(MATCH_END, minuteRef.current + delta / MS_PER_MINUTE);
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
  }, [running]);

  const reset = () => {
    minuteRef.current = 0;
    setMinute(0);
    setInspect(false);
  };

  const toggle = () => {
    if (minuteRef.current >= MATCH_END) {
      minuteRef.current = 0;
      setMinute(0);
      setInspect(false);
    }
    setRunning((value) => !value);
  };

  useStageDock({
    playing: running,
    onToggle: toggle,
    onReset: reset,
  });

  useEffect(() => {
    setInspect(false);
  }, [pressToInspect]);

  const aimTilt = useCallback((clientX: number, clientY: number) => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
    rx.set(-ny * TILT);
    ry.set(nx * TILT);
  }, [rx, ry]);

  const restTilt = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!pressToInspect) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pressToInspect) {
      const pointer = pointerRef.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
      if (distance > DRAG_ARM) pointer.dragged = true;
      if (pointer.dragged) {
        event.preventDefault();
        aimTilt(event.clientX, event.clientY);
      }
      return;
    }
    aimTilt(event.clientX, event.clientY);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    const dragged = pointer?.dragged ?? false;
    const same = pointer?.id === event.pointerId;
    pointerRef.current = null;
    restTilt();
    if (!pressToInspect || !same || dragged || !canReveal) return;
    setInspect((open) => !open);
  };

  const onPointerCancel = () => {
    pointerRef.current = null;
    restTilt();
  };

  return (
    <div
      ref={cardRef}
      className={`${compact ? "w-full" : ""} ${pressToInspect ? "touch-none" : ""}`.trim() || undefined}
      aria-expanded={showTimeline}
      tabIndex={pressToInspect ? 0 : undefined}
      onMouseEnter={pressToInspect ? undefined : () => setInspect(true)}
      onMouseLeave={
        pressToInspect
          ? undefined
          : () => {
              setInspect(false);
              restTilt();
            }
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={
        pressToInspect
          ? (event) => {
              if (!canReveal) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setInspect((open) => !open);
              }
            }
          : undefined
      }
    >
    <motion.div
      style={{
        rotateX: springRx,
        rotateY: springRy,
        transformPerspective: 1100,
        transformStyle: "preserve-3d",
        borderRadius: 28,
        boxShadow: cardShadow,
      }}
      className="[&_.shadow-heavy]:shadow-none"
    >
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
        ) : undefined
      }
      badgeTone="live"
    >
      <div className={compact ? "px-4 pt-4 pb-4" : "px-5 pt-4 pb-4"}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <StageMorph id={`${morph}-player`} className="min-w-0">
            <p className="text-[15px] font-medium tracking-tight text-zinc-900">William Saliba</p>
            <p className="text-[12px] tracking-tight text-zinc-400">Arsenal · vs Brighton</p>
          </StageMorph>
          <StageMorph id={`${morph}-clock`} className="shrink-0 text-right">
            <p className="font-mono text-[18px] tracking-tighter text-zinc-900 tabular-nums">
              {formatMinute(minute)}
            </p>
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
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-tight ${KINDS[last.kind].chip}`}
              >
                {Math.floor(last.m)}' · {compact ? last.kind : KINDS[last.kind].label}
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

        <AnimatePresence initial={false}>
          {showTimeline ? (
            <motion.div
              key="timeline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springs.soft}
              className="overflow-hidden"
            >
              <div className="pb-4">
                <div className="relative h-7">
                  <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-px bg-zinc-200" />
                  <div
                    className="absolute top-1/2 left-0 h-px -translate-y-px bg-zinc-400"
                    style={{ width: `${(minute / MATCH_END) * 100}%` }}
                  />
                  <div
                    className="absolute top-1 bottom-1 w-px -translate-x-1/2 bg-zinc-400"
                    style={{ left: `${(minute / MATCH_END) * 100}%` }}
                  />
                  <AnimatePresence>
                    {actions.map((event) => (
                      <motion.span
                        key={`${event.m}-${event.kind}`}
                        title={`${Math.floor(event.m)}' ${KINDS[event.kind].label}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={springs.snappy}
                        className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${KINDS[event.kind].swatch}`}
                        style={{ left: `${(event.m / MATCH_END) * 100}%` }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] tracking-tight text-zinc-400 tabular-nums">
                  <span>0</span>
                  <span>45</span>
                  <span>90</span>
                </div>
                {legend.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                    {legend.map((kind) => (
                      <span
                        key={kind}
                        className="inline-flex items-center gap-1.5 text-[11px] tracking-tight text-zinc-500"
                      >
                        <span className={`size-1.5 rounded-full ${KINDS[kind].swatch}`} />
                        {compact ? kind : KINDS[kind].label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {achieved ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springs.stamp}
              className="mb-4 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] tracking-tight text-emerald-800"
            >
              DEFCON achieved
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono tracking-tight tabular-nums">+2pts</span>
            </motion.p>
          ) : null}
        </AnimatePresence>

        {minute >= MATCH_END ? (
          <p className="text-[12px] tracking-tight text-zinc-400">Full time</p>
        ) : null}
      </div>
    </StageCard>
    </motion.div>
    </div>
  );
}
