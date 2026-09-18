import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useStudio } from "../lib/studio";
import type { NavItem } from "../lib/catalog";

type StudyRowProps = {
  item: NavItem;
};

export function StudyRow({ item }: StudyRowProps) {
  const { openEdit, openIterate, remixStudy, renameStudy, deleteStudy } = useStudio();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(item.title);
  }, [item.title]);

  useEffect(() => {
    if (renaming) {
      input.current?.focus();
      input.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const commitRename = () => {
    const next = draft.trim();
    if (next && next !== item.title) renameStudy(item.slug, next);
    else setDraft(item.title);
    setRenaming(false);
  };

  const run = (action: () => void) => {
    setMenu(null);
    action();
  };

  return (
    <div className="group relative flex items-center gap-1">
      {renaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
          <span aria-hidden="true" className="w-2 text-[11px] text-zinc-900">
            •
          </span>
          <input
            ref={input}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitRename();
              }
              if (event.key === "Escape") {
                setDraft(item.title);
                setRenaming(false);
              }
            }}
            aria-label={`Rename ${item.title}`}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] tracking-tighter text-zinc-900 outline-none"
          />
        </div>
      ) : (
        <NavLink
          to={`/${item.slug}`}
          end
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center gap-2 py-1.5 text-[15px] tracking-tighter transition-colors ${
              isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className={`w-2 shrink-0 text-[11px] ${
                  item.building ? "text-emerald-500" : isActive ? "text-zinc-900" : "text-transparent"
                }`}
              >
                •
              </span>
              <span className="min-w-0 truncate">{item.title}</span>
            </>
          )}
        </NavLink>
      )}

      <button
        type="button"
        aria-label={`Actions for ${item.title}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu(menu ? null : { top: rect.bottom + 6, left: Math.max(12, rect.right - 168) });
        }}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/80 hover:text-zinc-900 ${
          menu ? "bg-zinc-200/80 text-zinc-900" : ""
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="6" r="1.1" />
          <circle cx="6" cy="6" r="1.1" />
          <circle cx="10" cy="6" r="1.1" />
        </svg>
      </button>

      {menu ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${item.title} actions`}
          onPointerDown={(event) => event.stopPropagation()}
          style={{ top: menu.top, left: menu.left }}
          className="shadow-heavy fixed z-50 w-40 overflow-hidden rounded-2xl bg-white py-1.5"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-[13px] tracking-tight text-zinc-900 hover:bg-zinc-100"
            onClick={() => run(() => remixStudy(item.slug))}
          >
            Remix
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-[13px] tracking-tight text-zinc-900 hover:bg-zinc-100"
            onClick={() => run(() => setRenaming(true))}
          >
            Rename
          </button>
          {item.builtin ? null : item.remix ? (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-[13px] tracking-tight text-zinc-900 hover:bg-zinc-100"
              onClick={() => run(() => openIterate(item.slug))}
            >
              Iterate
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-[13px] tracking-tight text-zinc-900 hover:bg-zinc-100"
              onClick={() => run(() => openEdit(item.slug))}
            >
              Edit brief
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-[13px] tracking-tight text-zinc-500 hover:bg-zinc-100"
            onClick={() => run(() => deleteStudy(item.slug))}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
