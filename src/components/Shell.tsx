import { useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SITE } from "../lib/catalog";
import { StageDockProvider } from "../lib/stage-dock";
import { useStudio } from "../lib/studio";
import { springs } from "../lib/tokens";
import { ViewportProvider, useViewport } from "../lib/viewport";
import { LibraryNav } from "./LibraryNav";
import { RuntimeStatus } from "./RuntimeStatus";
import { Spotlight } from "./Spotlight";
import { StageCanvas } from "./StageCanvas";
import { StageDock } from "./StageDock";
import { StageModeToggle } from "./StageModeToggle";

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
      aria-label="New interface"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ShellChrome() {
  const { spotlightOpen, openCreate, closeSpotlight } = useStudio();
  const { narrow, showRotateHint } = useViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (spotlightOpen) closeSpotlight();
        else openCreate();
      }
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSpotlight, openCreate, spotlightOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!narrow) setMenuOpen(false);
  }, [narrow]);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-zinc-100 font-sans md:h-dvh md:flex-row">
      {narrow ? (
        <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <button
            type="button"
            aria-label="Open library"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex size-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-xl tracking-tighter text-zinc-900">{SITE.title}</h1>
          </div>
          <PlusButton onClick={openCreate} />
        </header>
      ) : (
        <aside className="flex flex-col px-8 pt-12 md:h-dvh md:w-3/12 md:min-w-[280px] md:overflow-y-auto">
          <h1 className="mb-2 font-serif text-3xl tracking-tighter text-zinc-900">{SITE.title}</h1>
          <p className="mb-12 max-w-[16.25rem] font-serif text-base tracking-tight text-zinc-600">{SITE.tagline}</p>
          <div className="flex-1 pb-8">
            <LibraryNav />
          </div>
          <div className="mb-8">
            <PlusButton onClick={openCreate} />
          </div>
        </aside>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:h-dvh md:w-9/12 md:p-4">
        <div data-stage className="relative flex min-h-[70dvh] w-full flex-1 flex-col rounded-xl bg-white md:min-h-0 md:h-full">
          <div className="absolute top-3 right-3 z-20">
            <StageModeToggle />
          </div>
          {showRotateHint ? (
            <p className="pointer-events-none absolute top-14 right-3 left-3 z-10 text-center font-mono text-[10px] tracking-tight text-zinc-400 md:left-auto md:w-52 md:text-right">
              Rotate for the full study, or switch to the mobile layout.
            </p>
          ) : null}
          <StageCanvas>
            <Outlet />
            <StageDock />
          </StageCanvas>
          <RuntimeStatus />
        </div>
      </main>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close library"
              className="absolute inset-0 bg-zinc-900/20"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -24, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -16, opacity: 0 }}
              transition={springs.snappy}
              className="shadow-heavy absolute inset-y-0 left-0 flex w-[min(20rem,calc(100%-2.5rem))] flex-col bg-zinc-100 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8"
            >
              <div className="mb-8 flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl tracking-tighter text-zinc-900">{SITE.title}</h1>
                  <p className="mt-1 max-w-[14rem] font-serif text-sm tracking-tight text-zinc-600">{SITE.tagline}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close library"
                  onClick={() => setMenuOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2 2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LibraryNav />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Spotlight />
    </div>
  );
}

export function Shell() {
  return (
    <ViewportProvider>
      <StageDockProvider>
        <ShellChrome />
      </StageDockProvider>
    </ViewportProvider>
  );
}
