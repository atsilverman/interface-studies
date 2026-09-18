import type { ReactNode } from "react";
import { motion } from "motion/react";
import { springs } from "../lib/tokens";
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
  const compact = layout === "mobile";

  return (
    <motion.div
      initial={{ width: compact ? "100%" : wide ? 560 : 440 }}
      animate={{ width: compact ? "100%" : wide ? 560 : 440 }}
      transition={springs.soft}
      style={{ borderRadius: 28 }}
      className="shadow-heavy overflow-hidden bg-zinc-100"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-medium tracking-tight text-zinc-900">{title}</h2>
          {meta ? <span className="text-[12.5px] tracking-tight text-zinc-400">{meta}</span> : null}
        </div>
        {badge ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${badgeTones[badgeTone]}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-2.5 pb-2.5">
        <div className="rounded-2xl bg-white">{children}</div>
      </div>
      {footer ? <p className="px-5 pb-3 text-center text-[11px] tracking-tight text-zinc-400">{footer}</p> : null}
    </motion.div>
  );
}
