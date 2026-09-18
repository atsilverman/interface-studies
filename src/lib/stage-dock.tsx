import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type StageDockConfig = {
  playing: boolean;
  onToggle: () => void;
  onReset: () => void;
};

export type StageDockSnapshot = {
  playing: boolean;
  onToggle: () => void;
  onReset: () => void;
};

type StageDockContextValue = {
  dock: StageDockSnapshot | null;
  setDock: (next: StageDockSnapshot | null) => void;
};

const StageDockContext = createContext<StageDockContextValue | null>(null);

export function StageDockProvider({ children }: { children: ReactNode }) {
  const [dock, setDockState] = useState<StageDockSnapshot | null>(null);
  const setDock = useCallback((next: StageDockSnapshot | null) => {
    setDockState(next);
  }, []);

  return <StageDockContext.Provider value={{ dock, setDock }}>{children}</StageDockContext.Provider>;
}

export function useStageDockState() {
  const value = useContext(StageDockContext);
  if (!value) throw new Error("useStageDockState must be used within StageDockProvider");
  return value;
}

export function useStageDock(config?: StageDockConfig) {
  const { setDock } = useStageDockState();
  const configRef = useRef(config);
  configRef.current = config;

  const [ownedPlaying, setOwnedPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const playing = config?.playing ?? ownedPlaying;

  const onToggle = useCallback(() => {
    if (configRef.current?.onToggle) configRef.current.onToggle();
    else setOwnedPlaying((value) => !value);
  }, []);

  const onReset = useCallback(() => {
    progressRef.current = 0;
    setProgress(0);
    if (configRef.current?.onReset) configRef.current.onReset();
    else setOwnedPlaying(false);
  }, []);

  useEffect(() => {
    setDock({
      playing,
      onToggle,
      onReset,
    });
    return () => setDock(null);
  }, [playing, onToggle, onReset, setDock]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const next = Math.min(1, progressRef.current + dt / 10_000);
      progressRef.current = next;
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  return { playing, progress, onToggle, onReset };
}
