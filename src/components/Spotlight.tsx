import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { springs } from "../lib/tokens";
import { useStudio, type SpotlightSession } from "../lib/studio";

function sessionKey(session: SpotlightSession) {
  return `${session.kind}-${session.at}`;
}

function SpotlightForm({
  session,
  onSubmit,
}: {
  session: SpotlightSession;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(session.kind === "edit" ? session.prompt : "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => input.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, []);

  const label = session.kind === "remix" ? `Remix ${session.sourceTitle}` : session.kind === "edit" ? `Edit ${session.title}` : "New interface";
  const placeholder =
    session.kind === "remix" ? "What should change…" : session.kind === "edit" ? "Update the brief…" : "Describe an interface…";
  const action = session.kind === "remix" ? "Remix" : session.kind === "edit" ? "Save" : "Run";
  const hint =
    session.kind === "remix"
      ? "Original stays. Keep this design language unless you ask otherwise."
      : session.kind === "edit"
        ? "Updates this study in place."
        : "⌘K";

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  return (
    <motion.form
      role="dialog"
      aria-label={label}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={springs.snappy}
      className="shadow-heavy w-full max-w-[560px] overflow-hidden rounded-[22px] bg-white"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {session.kind === "remix" ? (
        <p className="px-5 pt-4 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">{label}</p>
      ) : null}
      <input
        ref={input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className={`w-full border-0 bg-transparent px-5 text-[17px] tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400 ${
          session.kind === "remix" ? "pt-2 pb-4" : "py-4"
        }`}
      />
      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-2.5">
        <p className="min-w-0 truncate font-mono text-[10px] tracking-tight text-zinc-400">{hint}</p>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-[11px] tracking-tight text-white transition-colors hover:bg-zinc-800"
        >
          {action}
        </button>
      </div>
    </motion.form>
  );
}

export function Spotlight() {
  const { spotlightOpen, session, closeSpotlight, submitSpotlight } = useStudio();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && spotlightOpen) closeSpotlight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSpotlight, spotlightOpen]);

  return (
    <AnimatePresence>
      {spotlightOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/15 px-4 pt-[18vh] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSpotlight}
        >
          <SpotlightForm
            key={sessionKey(session)}
            session={session}
            onSubmit={submitSpotlight}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
