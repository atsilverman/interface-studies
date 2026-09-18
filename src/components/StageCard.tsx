import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { card, nestedRadius, springs, tilt } from "../lib/tokens";
import { useCardTilt } from "../lib/tilt";
import { useStudyFrame } from "../lib/study-frame";
import { useViewport } from "../lib/viewport";

type StageCardProps = {
  title: string;
  meta?: string;
  badge?: ReactNode;
  badgeTone?: "default" | "live" | "hit";
  footer?: string;
  wide?: boolean;
  children: ReactNode;
};

const badgeTones = {
  default: "bg-white text-zinc-500",
  live: "bg-emerald-50 text-emerald-700",
  hit: "bg-emerald-50 text-emerald-700",
};

export function StageCard({
  title,
  meta,
  badge,
  badgeTone = "default",
  footer,
  wide,
  children,
}: StageCardProps) {
  const { layout } = useViewport();
  const frame = useStudyFrame();
  const compact = layout === "mobile";
  const heading = frame?.title ?? title;
  const inset = compact ? card.insetCompact : card.inset;
  const wellRadius = nestedRadius(card.radius, inset);
  const cardTilt = useCardTilt();
  const { ref, rotateX, rotateY } = cardTilt;
  const sheen = useTransform([rotateY, rotateX], ([y, x]) => {
    const px = 50 + Number(y) * 3.2;
    const py = 50 - Number(x) * 3.2;
    return `radial-gradient(420px circle at ${px}% ${py}%, rgba(255,255,255,0.28), transparent 52%)`;
  });

  return (
    <motion.div
      initial={{ width: compact ? "100%" : wide ? 560 : 440 }}
      animate={{ width: compact ? "100%" : wide ? 560 : 440 }}
      transition={springs.soft}
      style={{ perspective: tilt.perspective }}
      className={compact ? "w-full max-w-full" : ""}
    >
      <motion.div
        ref={ref}
        onPointerMove={(event) => cardTilt.onPointerMove(event.clientX, event.clientY, event.pointerType)}
        onPointerEnter={(event) => cardTilt.onPointerEnter(event.clientX, event.clientY, event.pointerType)}
        onPointerDown={(event) => cardTilt.onPointerDown(event.clientX, event.clientY, event.pointerType)}
        onPointerUp={cardTilt.reset}
        onPointerCancel={cardTilt.reset}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") cardTilt.reset();
        }}
        style={{
          borderRadius: card.radius,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="shadow-heavy relative overflow-hidden bg-zinc-100"
      >
        <div className={`flex items-center justify-between ${compact ? "px-4 pt-3.5 pb-2.5" : "px-5 pt-4 pb-3"}`}>
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="truncate text-[15px] font-medium tracking-tight text-zinc-900">{heading}</h2>
            {meta ? <span className="shrink-0 text-[12.5px] tracking-tight text-zinc-400">{meta}</span> : null}
          </div>
          {badge ? (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${badgeTones[badgeTone]}`}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div style={{ paddingLeft: inset, paddingRight: inset, paddingBottom: inset }}>
          <div className="bg-white" style={{ borderRadius: wellRadius }}>
            {children}
          </div>
        </div>
        {footer ? (
          <p className={`text-center text-[11px] tracking-tight text-zinc-400 ${compact ? "px-4 pb-3" : "px-5 pb-3"}`}>
            {footer}
          </p>
        ) : null}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ background: sheen, borderRadius: card.radius }}
        />
      </motion.div>
    </motion.div>
  );
}
