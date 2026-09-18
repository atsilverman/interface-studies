import { AnimatePresence, motion } from "motion/react";
import { BUILD_STEPS } from "../lib/catalog";
import { useStudio } from "../lib/studio";
import { springs } from "../lib/tokens";

export function RuntimeStatus({ inline = false }: { inline?: boolean }) {
  const { job, cancelJob } = useStudio();
  const steps = job?.steps ?? BUILD_STEPS;
  const label = job ? steps[Math.min(job.step, steps.length - 1)] : "";
  const canCancel = Boolean(job?.hold && job.progress < 100);

  return (
    <AnimatePresence>
      {job ? (
        <motion.div
          initial={{ opacity: 0, y: inline ? -6 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: inline ? -4 : 8 }}
          transition={springs.snappy}
          className={
            inline
              ? "shadow-heavy mx-3 mb-2 shrink-0 rounded-2xl bg-white px-4 py-3"
              : "shadow-heavy absolute bottom-8 left-1/2 z-40 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-white px-4 py-3"
          }
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[13px] tracking-tight text-zinc-900">{job.title}</p>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-tight text-emerald-700">
              <motion.span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.28, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              {job.progress >= 100 ? "Live" : job.hold ? "Building" : "Filing"}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-[11px] tracking-tight text-zinc-400">{label}</p>
            {canCancel ? (
              <button
                type="button"
                onClick={cancelJob}
                className="shrink-0 font-mono text-[10px] tracking-tight text-zinc-400 transition-colors hover:text-red-500"
              >
                Cancel
              </button>
            ) : null}
          </div>
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
