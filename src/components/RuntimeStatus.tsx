import { AnimatePresence, motion } from "motion/react";
import { BUILD_STEPS } from "../lib/catalog";
import { useStudio } from "../lib/studio";
import { springs } from "../lib/tokens";

export function RuntimeStatus() {
  const { job } = useStudio();
  const steps = job?.steps ?? BUILD_STEPS;
  const label = job ? steps[Math.min(job.step, steps.length - 1)] : "";

  return (
    <AnimatePresence>
      {job ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={springs.snappy}
          className="shadow-heavy pointer-events-none absolute bottom-28 left-1/2 z-40 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-white px-4 py-3 md:bottom-8"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[13px] tracking-tight text-zinc-900">{job.title}</p>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-tight text-emerald-700">
              <motion.span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.28, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              {job.progress >= 100 ? "Live" : job.hold ? "Building" : "Filing"}
            </span>
          </div>
          <p className="mb-2 font-mono text-[11px] tracking-tight text-zinc-400">{label}</p>
          <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-zinc-900"
              animate={{ width: `${job.progress}%` }}
              transition={springs.soft}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
