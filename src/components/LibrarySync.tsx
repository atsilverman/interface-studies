import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cloud, CloudOff, LoaderCircle } from "lucide-react";
import { springs } from "../lib/tokens";
import { useStudio, type SyncStatus } from "../lib/studio";

const icon = { size: 14, strokeWidth: 1.75, "aria-hidden": true } as const;

const HINT: Record<Exclude<SyncStatus, "off">, string> = {
  saving: "Saving",
  saved: "Saved",
  offline: "Offline",
  error: "Save failed",
};

export function LibrarySync() {
  const { syncConfigured, syncStatus } = useStudio();
  const previous = useRef(syncStatus);
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    const from = previous.current;
    previous.current = syncStatus;
    if (from === "saving" && syncStatus === "saved") {
      setSplash(true);
      const id = window.setTimeout(() => setSplash(false), 900);
      return () => window.clearTimeout(id);
    }
  }, [syncStatus]);

  if (!syncConfigured || syncStatus === "off") return null;

  const saving = syncStatus === "saving";
  const failed = syncStatus === "error" || syncStatus === "offline";
  const live = saving || splash;
  const label = HINT[syncStatus];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={label}
      animate={{
        backgroundColor: live ? "rgb(236 253 245)" : failed ? "rgb(254 242 242)" : "rgba(244, 244, 245, 0.85)",
      }}
      transition={springs.soft}
      className={`pointer-events-none flex h-9 items-center gap-1.5 rounded-full px-2.5 backdrop-blur-md ${
        failed ? "text-red-500" : live ? "text-emerald-600" : "text-zinc-400"
      }`}
    >
      <span className="relative flex size-3.5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {saving ? (
            <motion.span
              key="spin"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.snappy}
            >
              <motion.span
                className="flex"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
              >
                <LoaderCircle {...icon} />
              </motion.span>
            </motion.span>
          ) : (
            <motion.span
              key={failed ? "off" : "cloud"}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.7, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.stamp}
            >
              {failed ? <CloudOff {...icon} /> : <Cloud {...icon} />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <AnimatePresence initial={false}>
        {saving || splash || failed ? (
          <motion.span
            key={label}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={springs.snappy}
            className="overflow-hidden font-mono text-[10px] tracking-tight whitespace-nowrap"
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
