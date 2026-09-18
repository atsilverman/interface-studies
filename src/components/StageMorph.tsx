import type { ReactNode } from "react";
import { motion } from "motion/react";
import { springs } from "../lib/tokens";

type StageMorphProps = {
  id?: string;
  className?: string;
  children?: ReactNode;
  layout?: boolean | "position" | "size";
};

/** Shared-element morph for desktop ↔ mobile. Same idea as Keynote Magic Move. */
export function StageMorph({ id, className, children, layout = "position" }: StageMorphProps) {
  return (
    <motion.div
      layout={layout}
      layoutId={id}
      initial={false}
      className={className}
      transition={springs.soft}
    >
      {children}
    </motion.div>
  );
}
