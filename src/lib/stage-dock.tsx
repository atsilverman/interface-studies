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

export function useStageDock(config: StageDockConfig) {
  const { setDock } = useStageDockState();
  const configRef = useRef(config);
  configRef.current = config;

  const playing = config.playing;

  useEffect(() => {
    setDock({
      playing: configRef.current.playing,
      onToggle: () => configRef.current.onToggle(),
      onReset: () => configRef.current.onReset(),
    });
    return () => setDock(null);
  }, [playing, setDock]);
}
