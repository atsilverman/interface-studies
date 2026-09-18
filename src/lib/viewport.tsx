import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { builtinBySlug } from "./catalog";
import { breakpoints, card } from "./tokens";

export type StageMode = "auto" | "desktop" | "mobile";
export type StudyFit = "landscape" | "portrait" | "fluid";
export type StageLayout = "desktop" | "mobile";

type ViewportValue = {
  mode: StageMode;
  layout: StageLayout;
  fit: StudyFit;
  frameWidth: number;
  narrow: boolean;
  portrait: boolean;
  width: number;
  height: number;
  showRotateHint: boolean;
  setMode: (mode: StageMode) => void;
};

const STORAGE_KEY = "interface-studies-stage-mode";
const ViewportContext = createContext<ViewportValue | null>(null);

function loadMode(): StageMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "auto" || raw === "desktop" || raw === "mobile") return raw;
  } catch {
    /* ignore */
  }
  return "auto";
}

function readSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function resolveLayout(mode: StageMode, fit: StudyFit, width: number): StageLayout {
  if (mode === "desktop") return "desktop";
  if (mode === "mobile") return "mobile";
  if (width >= breakpoints.narrow) return "desktop";
  if (fit === "landscape") return "desktop";
  return "mobile";
}

export function ViewportProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams();
  const built = slug ? builtinBySlug(slug) : undefined;
  const fit: StudyFit = built && "fit" in built ? built.fit : "fluid";
  const frameWidth = built && "frame" in built && built.frame === "wide" ? card.wide : card.width;

  const [mode, setModeState] = useState<StageMode>(loadMode);
  const [size, setSize] = useState(readSize);

  useEffect(() => {
    const onResize = () => setSize(readSize());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const setMode = useCallback((next: StageMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const narrow = size.width < breakpoints.narrow;
  const portrait = size.height >= size.width;
  const layout = resolveLayout(mode, fit, size.width);
  const showRotateHint = layout === "desktop" && fit === "landscape" && narrow && portrait;

  const value = useMemo<ViewportValue>(
    () => ({
      mode,
      layout,
      fit,
      frameWidth,
      narrow,
      portrait,
      width: size.width,
      height: size.height,
      showRotateHint,
      setMode,
    }),
    [fit, frameWidth, layout, mode, narrow, portrait, setMode, showRotateHint, size.height, size.width],
  );

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
}

export function useViewport() {
  const value = useContext(ViewportContext);
  if (!value) throw new Error("useViewport must be used within ViewportProvider");
  return value;
}
