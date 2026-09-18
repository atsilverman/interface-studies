import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BUILD_STEPS,
  EDIT_STEPS,
  REMIX_STEPS,
  builtinBySlug,
  builtins,
  composePrompt,
  deriveStudy,
  remixTitle,
  uniqueSlug,
  type NavItem,
  type SourceStudy,
  type UserStudy,
} from "./catalog";

const STORAGE_KEY = "silverman-studio-library";

export type SpotlightSession =
  | { kind: "create"; at: number }
  | { kind: "edit"; slug: string; title: string; prompt: string; at: number }
  | { kind: "remix"; slug: string; title: string; sourceTitle: string; at: number };

type Job = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  step: number;
  progress: number;
  steps: readonly string[];
};

type Library = {
  studies: UserStudy[];
  builtinTitles: Record<string, string>;
  hiddenBuiltins: string[];
};

type StudioValue = {
  items: NavItem[];
  userStudies: UserStudy[];
  spotlightOpen: boolean;
  session: SpotlightSession;
  job: Job | null;
  openCreate: () => void;
  openEdit: (slug: string) => void;
  openIterate: (slug: string) => void;
  closeSpotlight: () => void;
  submitSpotlight: (value: string) => void;
  remixStudy: (slug: string) => void;
  renameStudy: (slug: string, title: string) => void;
  deleteStudy: (slug: string) => void;
};

const StudioContext = createContext<StudioValue | null>(null);

function migrateStudy(raw: unknown): UserStudy | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<UserStudy>;
  if (!item.slug || !item.title || typeof item.prompt !== "string") return null;
  const prompt = item.prompt;
  return {
    slug: item.slug,
    title: item.title,
    category: item.category ?? "Studio",
    prompt,
    basePrompt: item.basePrompt ?? prompt,
    directions: Array.isArray(item.directions) ? item.directions.filter((note) => typeof note === "string") : [],
    remixOf: item.remixOf,
    remixOfTitle: item.remixOfTitle,
    createdAt: item.createdAt ?? Date.now(),
    updatedAt: item.updatedAt ?? item.createdAt ?? Date.now(),
  };
}

function emptyLibrary(): Library {
  return { studies: [], builtinTitles: {}, hiddenBuiltins: [] };
}

function loadLibrary(): Library {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLibrary();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { studies: parsed.map(migrateStudy).filter((item): item is UserStudy => item !== null), builtinTitles: {}, hiddenBuiltins: [] };
    }
    if (!parsed || typeof parsed !== "object") return emptyLibrary();
    const data = parsed as Partial<Library>;
    return {
      studies: Array.isArray(data.studies) ? data.studies.map(migrateStudy).filter((item): item is UserStudy => item !== null) : [],
      builtinTitles: data.builtinTitles && typeof data.builtinTitles === "object" ? data.builtinTitles : {},
      hiddenBuiltins: Array.isArray(data.hiddenBuiltins) ? data.hiddenBuiltins.filter((slug) => typeof slug === "string") : [],
    };
  } catch {
    return emptyLibrary();
  }
}

function displayTitle(slug: string, fallback: string, builtinTitles: Record<string, string>) {
  return builtinTitles[slug]?.trim() || fallback;
}

function lookupSource(slug: string, studies: UserStudy[], builtinTitles: Record<string, string>): SourceStudy | null {
  const user = studies.find((item) => item.slug === slug);
  if (user) {
    return {
      slug: user.slug,
      title: user.title,
      category: user.category,
      prompt: user.prompt,
      basePrompt: user.basePrompt,
      directions: user.directions,
      builtin: false,
    };
  }
  const built = builtinBySlug(slug);
  if (!built) return null;
  return {
    slug: built.slug,
    title: displayTitle(built.slug, built.title, builtinTitles),
    category: built.category,
    prompt: built.prompt,
    basePrompt: built.prompt,
    directions: [],
    builtin: true,
  };
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [library, setLibrary] = useState<Library>(loadLibrary);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [session, setSession] = useState<SpotlightSession>({ kind: "create", at: 0 });
  const [job, setJob] = useState<Job | null>(null);

  const userStudies = library.studies;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    if (!job?.slug) return;
    const total = job.steps.length;

    const tick = window.setInterval(() => {
      setJob((current) => {
        if (!current) return current;
        const step = current.step + 1;
        const progress = Math.min(100, Math.round((step / total) * 100));
        return { ...current, step, progress };
      });
    }, 780);

    const done = window.setTimeout(() => setJob(null), 780 * total + 480);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [job?.slug, job?.steps.length]);

  const takenSlugs = useCallback(() => {
    return [...builtins.map((item) => item.slug), ...userStudies.map((item) => item.slug), job?.slug ?? ""];
  }, [job?.slug, userStudies]);

  const startJob = useCallback((record: { slug: string; title: string; category: string; prompt: string }, steps: readonly string[]) => {
    setJob({ ...record, step: 0, progress: 8, steps });
  }, []);

  const closeSpotlight = useCallback(() => {
    setSpotlightOpen(false);
    setSession({ kind: "create", at: 0 });
  }, []);

  const openCreate = useCallback(() => {
    setSession({ kind: "create", at: Date.now() });
    setSpotlightOpen(true);
  }, []);

  const openEdit = useCallback(
    (slug: string) => {
      const source = lookupSource(slug, userStudies, library.builtinTitles);
      if (!source || source.builtin) return;
      setSession({ kind: "edit", slug: source.slug, title: source.title, prompt: source.prompt, at: Date.now() });
      setSpotlightOpen(true);
    },
    [library.builtinTitles, userStudies],
  );

  const openIterate = useCallback(
    (slug: string) => {
      const source = lookupSource(slug, userStudies, library.builtinTitles);
      const user = userStudies.find((item) => item.slug === slug);
      if (!source || source.builtin || !user) return;
      setSession({
        kind: "remix",
        slug: user.slug,
        title: user.title,
        sourceTitle: user.remixOfTitle ?? user.title,
        at: Date.now(),
      });
      setSpotlightOpen(true);
    },
    [library.builtinTitles, userStudies],
  );

  const items = useMemo<NavItem[]>(() => {
    const built = builtins
      .filter((item) => !library.hiddenBuiltins.includes(item.slug))
      .map((item) => ({
        slug: item.slug,
        title: displayTitle(item.slug, item.title, library.builtinTitles),
        category: item.category,
        builtin: true,
        building: job?.slug === item.slug,
      }));
    const extra = userStudies.map((item) => ({
      slug: item.slug,
      title: item.title,
      category: item.category,
      building: job?.slug === item.slug,
      remix: Boolean(item.remixOf),
    }));
    return [...built, ...extra];
  }, [job?.slug, library.builtinTitles, library.hiddenBuiltins, userStudies]);

  const fallbackSlug = useCallback(
    (except?: string) => items.find((item) => item.slug !== except)?.slug ?? builtins[0].slug,
    [items],
  );

  const submitSpotlight = useCallback(
    (value: string) => {
      const text = value.trim();
      if (!text) return;

      if (session.kind === "create") {
        const derived = deriveStudy(text, takenSlugs());
        const now = Date.now();
        const record: UserStudy = {
          ...derived,
          basePrompt: derived.prompt,
          directions: [],
          createdAt: now,
          updatedAt: now,
        };
        setLibrary((current) => ({ ...current, studies: [...current.studies, record] }));
        startJob(record, BUILD_STEPS);
        closeSpotlight();
        navigate(`/${record.slug}`);
        return;
      }

      if (session.kind === "edit") {
        const current = userStudies.find((item) => item.slug === session.slug);
        if (!current) return;
        const next: UserStudy = { ...current, prompt: text, basePrompt: text, directions: [], updatedAt: Date.now() };
        setLibrary((library) => ({
          ...library,
          studies: library.studies.map((item) => (item.slug === next.slug ? next : item)),
        }));
        startJob(next, EDIT_STEPS);
        closeSpotlight();
        navigate(`/${next.slug}`);
        return;
      }

      const current = userStudies.find((item) => item.slug === session.slug);
      if (!current) return;
      const directions = [...current.directions, text];
      const next: UserStudy = {
        ...current,
        directions,
        prompt: composePrompt(current.basePrompt, directions),
        updatedAt: Date.now(),
      };
      setLibrary((library) => ({
        ...library,
        studies: library.studies.map((item) => (item.slug === next.slug ? next : item)),
      }));
      startJob(next, REMIX_STEPS);
      closeSpotlight();
      navigate(`/${next.slug}`);
    },
    [closeSpotlight, navigate, session, startJob, takenSlugs, userStudies],
  );

  const remixStudy = useCallback(
    (slug: string) => {
      const source = lookupSource(slug, userStudies, library.builtinTitles);
      if (!source) return;
      const titles = [
        ...builtins.map((item) => displayTitle(item.slug, item.title, library.builtinTitles)),
        ...userStudies.map((item) => item.title),
      ];
      const title = remixTitle(source.title, titles);
      const record: UserStudy = {
        slug: uniqueSlug(title, takenSlugs()),
        title,
        category: source.category,
        prompt: source.prompt,
        basePrompt: source.basePrompt,
        directions: [...source.directions],
        remixOf: source.slug,
        remixOfTitle: source.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setLibrary((current) => ({ ...current, studies: [...current.studies, record] }));
      setSession({ kind: "remix", slug: record.slug, title: record.title, sourceTitle: source.title, at: Date.now() });
      setSpotlightOpen(true);
      navigate(`/${record.slug}`);
    },
    [library.builtinTitles, navigate, takenSlugs, userStudies],
  );

  const renameStudy = useCallback((slug: string, title: string) => {
    const next = title.trim().slice(0, 32);
    if (!next) return;
    if (builtinBySlug(slug)) {
      setLibrary((current) => ({ ...current, builtinTitles: { ...current.builtinTitles, [slug]: next } }));
      return;
    }
    setLibrary((current) => ({
      ...current,
      studies: current.studies.map((item) => (item.slug === slug ? { ...item, title: next, updatedAt: Date.now() } : item)),
    }));
  }, []);

  const deleteStudy = useCallback(
    (slug: string) => {
      const currentPath = location.pathname.replace(/^\//, "");
      const shouldLeave = currentPath === slug;
      const nextSlug = fallbackSlug(slug);

      if (builtinBySlug(slug)) {
        setLibrary((current) => ({
          ...current,
          hiddenBuiltins: current.hiddenBuiltins.includes(slug) ? current.hiddenBuiltins : [...current.hiddenBuiltins, slug],
        }));
      } else {
        setLibrary((current) => ({ ...current, studies: current.studies.filter((item) => item.slug !== slug) }));
      }

      if (job?.slug === slug) setJob(null);
      if (shouldLeave) navigate(`/${nextSlug}`);
    },
    [fallbackSlug, job?.slug, location.pathname, navigate],
  );

  const value = useMemo<StudioValue>(
    () => ({
      items,
      userStudies,
      spotlightOpen,
      session,
      job,
      openCreate,
      openEdit,
      openIterate,
      closeSpotlight,
      submitSpotlight,
      remixStudy,
      renameStudy,
      deleteStudy,
    }),
    [
      closeSpotlight,
      deleteStudy,
      items,
      job,
      openCreate,
      openEdit,
      openIterate,
      remixStudy,
      renameStudy,
      session,
      spotlightOpen,
      submitSpotlight,
      userStudies,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudio must be used within StudioProvider");
  return value;
}
