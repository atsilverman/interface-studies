import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { springs } from "../lib/tokens";
import { useStudio } from "../lib/studio";
import { StudioOverlay } from "./StudioOverlay";

function DeleteForm({
  title,
  onConfirm,
}: {
  title: string;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const matched = value.trim() === title;

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.form
      role="dialog"
      aria-modal="true"
      aria-label={`Delete ${title}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={springs.snappy}
      className="shadow-heavy w-full overflow-hidden rounded-[22px] bg-white"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        if (matched) onConfirm();
      }}
    >
      <p className="px-5 pt-4 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">Delete {title}</p>
      <input
        ref={input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Type ${title} to confirm`}
        autoComplete="off"
        spellCheck={false}
        className="w-full border-0 bg-transparent px-5 pt-2 pb-4 text-[17px] tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400"
      />
      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-2.5">
        <p className="min-w-0 truncate font-mono text-[10px] tracking-tight text-zinc-400">This cannot be undone.</p>
        <button
          type="submit"
          disabled={!matched}
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-[11px] tracking-tight text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          Delete
        </button>
      </div>
    </motion.form>
  );
}

export function DeleteConfirm() {
  const { deletePrompt, closeDelete, confirmDelete } = useStudio();

  useEffect(() => {
    if (!deletePrompt) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDelete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDelete, deletePrompt]);

  return (
    <StudioOverlay open={Boolean(deletePrompt)} onClose={closeDelete} zClass="z-[70]">
      {deletePrompt ? (
        <DeleteForm
          key={`${deletePrompt.slug}-${deletePrompt.title}`}
          title={deletePrompt.title}
          onConfirm={confirmDelete}
        />
      ) : null}
    </StudioOverlay>
  );
}
