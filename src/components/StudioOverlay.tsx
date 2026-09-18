import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useVisualFrame } from "../lib/visual-frame";

export function StudioOverlay({
  open,
  onClose,
  zClass = "z-50",
  children,
}: {
  open: boolean;
  onClose: () => void;
  zClass?: string;
  children: ReactNode;
}) {
  const frame = useVisualFrame(open);
  const keyboard = frame.inset > 80;
  const ignoreUntil = useRef(0);

  useEffect(() => {
    if (open) ignoreUntil.current = Date.now() + 500;
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`fixed inset-x-0 ${zClass} flex items-start justify-center bg-zinc-900/15 px-3 pb-3 backdrop-blur-[3px] ${
            keyboard ? "pt-2" : "pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-[18vh]"
          }`}
          style={{ top: frame.top, height: frame.height }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (Date.now() < ignoreUntil.current) return;
            onClose();
          }}
        >
          <div className="flex max-h-full w-full max-w-[560px] justify-center">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
