import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { springs } from "../lib/tokens";
import { useVisualFrame } from "../lib/visual-frame";
import { PROMPT_INPUT_ID, useStudio, type SpotlightSession } from "../lib/studio";
import { StudioOverlay } from "./StudioOverlay";

function sessionKey(session: SpotlightSession) {
  if (session.kind === "create") return "create";
  if (session.kind === "edit") return `edit-${session.slug}`;
  return `remix-${session.slug}`;
}

function fitPrompt(node: HTMLTextAreaElement | null, cap: number) {
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${Math.min(node.scrollHeight, cap)}px`;
}

function SpotlightForm({
  session,
  generateConfigured,
  onSubmit,
}: {
  session: SpotlightSession;
  generateConfigured: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const frame = useVisualFrame(true);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  const cap = Math.max(52, Math.min(frame.height * (frame.inset > 80 ? 0.28 : 0.4), 280));

  useLayoutEffect(() => {
    fitPrompt(input.current, cap);
  }, [cap, value]);

  const label = session.kind === "remix" ? `Remix ${session.sourceTitle}` : session.kind === "edit" ? `Edit ${session.title}` : "New interface";
  const placeholder =
    session.kind === "remix" ? "What should change…" : session.kind === "edit" ? "What should change…" : "Describe an interface…";
  const action = session.kind === "remix" ? "Remix" : session.kind === "edit" ? "Edit" : generateConfigured ? "Build" : "File";
  const hint =
    session.kind === "remix"
      ? generateConfigured
        ? "Original stays. Cursor builds a new live study."
        : "Original stays. Keep this design language unless you ask otherwise."
      : session.kind === "edit"
        ? generateConfigured
          ? "Cursor rewrites this study in place."
          : "Saves a direction. The live widget changes when rebuilt in Cursor."
        : generateConfigured
          ? "Cursor builds a live study on this device."
          : "Files a brief. Add CURSOR_API_KEY on the server to build.";

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  const padded = session.kind === "remix" || session.kind === "edit";

  return (
    <motion.form
      role="dialog"
      aria-label={label}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={springs.snappy}
      className="shadow-heavy flex max-h-full w-full flex-col overflow-hidden rounded-[22px] bg-white"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {padded ? (
        <p className="shrink-0 px-5 pt-4 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">{label}</p>
      ) : null}
      <textarea
        id={PROMPT_INPUT_ID}
        ref={input}
        value={value}
        rows={1}
        autoFocus
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        enterKeyHint="enter"
        inputMode="text"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className={`block min-h-[3.25rem] w-full resize-none overflow-x-hidden overflow-y-auto border-0 bg-transparent px-5 text-[17px] leading-relaxed tracking-tight break-words whitespace-pre-wrap text-zinc-900 outline-none placeholder:text-zinc-400 ${
          padded ? "pt-2 pb-4" : "py-4"
        }`}
      />
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 px-5 py-2.5">
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
  const { spotlightOpen, session, closeSpotlight, submitSpotlight, generateConfigured } = useStudio();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && spotlightOpen) closeSpotlight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSpotlight, spotlightOpen]);

  return (
    <StudioOverlay open={spotlightOpen} onClose={closeSpotlight}>
      <SpotlightForm
        key={sessionKey(session)}
        session={session}
        generateConfigured={generateConfigured}
        onSubmit={submitSpotlight}
      />
    </StudioOverlay>
  );
}
