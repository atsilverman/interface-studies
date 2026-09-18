import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  BUILD_STEPS,
  EDIT_STEPS,
  REMIX_STEPS,
  builtinBySlug,
  builtins,
  cloneSourceSlug,
  composePrompt,
  copyTitle,
  deriveStudy,
  remixTitle,
  uniqueSlug,
  type NavItem,
  type SourceStudy,
  type UserStudy,
} from "./catalog";
import { isCloudConfigured, pullLibrary, pushLibrary } from "./cloud";
import { loadLibrary, saveLibrary, touchLibrary, type Library } from "./library";
import { isWorkspaceId, readWorkspaceId, writeWorkspaceId } from "./workspace";

const SAVE_DEBOUNCE_MS = 2000;
const PULL_EVERY_MS = 60_000;

export type SpotlightSession =
  | { kind: "create"; at: number }
  | { kind: "edit"; slug: string; title: string; at: number }
  | { kind: "remix"; slug: string; title: string; sourceTitle: string; at: number };

export type SyncStatus = "off" | "saving" | "saved" | "offline" | "error";

type Job = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  step: number;
  progress: number;
  steps: readonly string[];
};

type StudioValue = {
  items: NavItem[];
  userStudies: UserStudy[];
  spotlightOpen: boolean;
  session: SpotlightSession;
  job: Job | null;
  openCreate: () => void;
  openEdit: (slug: string) => void;
  closeSpotlight: () => void;
  submitSpotlight: (value: string) => void;
  remixStudy: (slug: string) => void;
  copyStudy: (slug: string) => void;
  renameStudy: (slug: string, title: string) => void;
  deletePrompt: { slug: string; title: string } | null;
  requestDelete: (slug: string, title: string) => void;
  closeDelete: () => void;
  confirmDelete: () => void;
  syncConfigured: boolean;
  syncStatus: SyncStatus;
};

const StudioContext = createContext<StudioValue | null>(null);

function displayTitle(slug: string, fallback: string, builtinTitles: Record<string, string>) {
  return builtinTitles[slug]?.trim() || fallback;
}

function lookupSource(
  slug: string,
  studies: UserStudy[],
  builtinTitles: Record<string, string>,
  builtinEdits: Record<string, string[]>,
): SourceStudy | null {
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
  const directions = builtinEdits[slug] ?? [];
  return {
    slug: built.slug,
    title: displayTitle(built.slug, built.title, builtinTitles),
    category: built.category,
    prompt: composePrompt(built.prompt, directions),
    basePrompt: built.prompt,
    directions,
    builtin: true,
  };
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [library, setLibrary] = useState<Library>(loadLibrary);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [session, setSession] = useState<SpotlightSession>({ kind: "create", at: 0 });
  const [job, setJob] = useState<Job | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<{ slug: string; title: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (isCloudConfigured() ? "saving" : "off"));
  const libraryRef = useRef(library);
  const workspaceRef = useRef<string | null>(null);
  const skipPush = useRef(true);
  const applyingRemote = useRef(false);
  const syncConfigured = isCloudConfigured();

  libraryRef.current = library;

  const commitLibrary = useCallback((patch: (current: Library) => Partial<Omit<Library, "updatedAt">>) => {
    setLibrary((current) => touchLibrary(current, patch(current)));
  }, []);

  const userStudies = library.studies;

  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  useEffect(() => {
    if (!syncConfigured) return;

    const fromWindow = new URLSearchParams(window.location.search).get("workspace")?.trim() ?? "";
    const fromRouter = searchParams.get("workspace")?.trim() ?? "";
    const incoming = isWorkspaceId(fromWindow) ? fromWindow : fromRouter;
    const joining = isWorkspaceId(incoming);
    if (joining) {
      writeWorkspaceId(incoming);
      if (searchParams.has("workspace")) {
        const next = new URLSearchParams(searchParams);
        next.delete("workspace");
        setSearchParams(next, { replace: true });
      }
    }

    const id = readWorkspaceId();
    workspaceRef.current = id;
    let cancelled = false;

    const applyRemote = (remote: Library) => {
      applyingRemote.current = true;
      setLibrary(remote);
    };

    const cycle = async (preferRemote: boolean) => {
      if (!navigator.onLine) {
        if (!cancelled) setSyncStatus("offline");
        return;
      }
      try {
        const local = libraryRef.current;
        const remote = await pullLibrary(id);
        if (cancelled) return;
        if (preferRemote && remote) {
          applyRemote(remote);
          setSyncStatus("saved");
          return;
        }
        if (remote && remote.updatedAt > local.updatedAt) {
          applyRemote(remote);
          setSyncStatus("saved");
          return;
        }
        if (local.updatedAt > (remote?.updatedAt ?? 0)) {
          setSyncStatus("saving");
          const stored = await pushLibrary(id, local);
          if (cancelled) return;
          if (stored.updatedAt > local.updatedAt) applyRemote(stored);
          setSyncStatus("saved");
          return;
        }
        setSyncStatus("saved");
      } catch {
        if (!cancelled) setSyncStatus(navigator.onLine ? "error" : "offline");
      }
    };

    void cycle(joining).finally(() => {
      skipPush.current = false;
    });

    const interval = window.setInterval(() => void cycle(false), PULL_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void cycle(false);
    };
    const onPageHide = () => {
      const local = libraryRef.current;
      if (local.updatedAt > 0) void pushLibrary(id, local);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onVisible);
    };
    // Join from the landing URL once; later library edits debounce separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConfigured]);

  useEffect(() => {
    if (!syncConfigured) return;
    if (skipPush.current) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    const id = workspaceRef.current;
    if (!id || library.updatedAt <= 0) return;
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("saving");
    const timer = window.setTimeout(() => {
      const snapshot = libraryRef.current;
      void pushLibrary(id, snapshot)
        .then((stored) => {
          if (stored.updatedAt > snapshot.updatedAt) {
            applyingRemote.current = true;
            setLibrary(stored);
          }
          setSyncStatus("saved");
        })
        .catch(() => setSyncStatus(navigator.onLine ? "error" : "offline"));
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [library, syncConfigured]);

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
      const source = lookupSource(slug, userStudies, library.builtinTitles, library.builtinEdits);
      if (!source) return;
      setSession({ kind: "edit", slug: source.slug, title: source.title, at: Date.now() });
      setSpotlightOpen(true);
    },
    [library.builtinEdits, library.builtinTitles, userStudies],
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
        remix: Boolean(item.remixOf) && !item.copied,
        copied: Boolean(item.copied),
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
        commitLibrary((current) => ({ studies: [...current.studies, record] }));
        startJob(record, BUILD_STEPS);
        closeSpotlight();
        navigate(`/${record.slug}`);
        return;
      }

      if (session.kind === "edit") {
        const source = lookupSource(session.slug, userStudies, library.builtinTitles, library.builtinEdits);
        if (!source) return;
        const directions = [...source.directions, text];
        const prompt = composePrompt(source.basePrompt, directions);
        if (source.builtin) {
          commitLibrary((current) => ({
            builtinEdits: { ...current.builtinEdits, [source.slug]: directions },
          }));
        } else {
          commitLibrary((current) => ({
            studies: current.studies.map((item) =>
              item.slug === source.slug ? { ...item, directions, prompt, updatedAt: Date.now() } : item,
            ),
          }));
        }
        startJob({ slug: source.slug, title: source.title, category: source.category, prompt }, EDIT_STEPS);
        closeSpotlight();
        navigate(`/${source.slug}`);
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
      commitLibrary((library) => ({
        studies: library.studies.map((item) => (item.slug === next.slug ? next : item)),
      }));
      startJob(next, REMIX_STEPS);
      closeSpotlight();
      navigate(`/${next.slug}`);
    },
    [closeSpotlight, commitLibrary, library.builtinEdits, library.builtinTitles, navigate, session, startJob, takenSlugs, userStudies],
  );

  const cloneStudy = useCallback(
    (slug: string, mode: "remix" | "copy") => {
      const source = lookupSource(slug, userStudies, library.builtinTitles, library.builtinEdits);
      if (!source) return null;
      const titles = [
        ...builtins.map((item) => displayTitle(item.slug, item.title, library.builtinTitles)),
        ...userStudies.map((item) => item.title),
      ];
      const title = mode === "copy" ? copyTitle(source.title, titles) : remixTitle(source.title, titles);
      const cloneOf = cloneSourceSlug(source.slug, userStudies) ?? (source.builtin ? source.slug : undefined);
      const record: UserStudy = {
        slug: uniqueSlug(title, takenSlugs()),
        title,
        category: source.category,
        prompt: source.prompt,
        basePrompt: source.basePrompt,
        directions: mode === "copy" ? [...source.directions] : [],
        remixOf: source.slug,
        remixOfTitle: source.title,
        cloneOf,
        copied: mode === "copy",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      commitLibrary((current) => ({ studies: [...current.studies, record] }));
      return record;
    },
    [commitLibrary, library.builtinEdits, library.builtinTitles, takenSlugs, userStudies],
  );

  const remixStudy = useCallback(
    (slug: string) => {
      const record = cloneStudy(slug, "remix");
      if (!record) return;
      setSession({ kind: "remix", slug: record.slug, title: record.title, sourceTitle: record.remixOfTitle ?? record.title, at: Date.now() });
      setSpotlightOpen(true);
      navigate(`/${record.slug}`);
    },
    [cloneStudy, navigate],
  );

  const copyStudy = useCallback(
    (slug: string) => {
      const record = cloneStudy(slug, "copy");
      if (!record) return;
      navigate(`/${record.slug}`);
    },
    [cloneStudy, navigate],
  );

  const renameStudy = useCallback((slug: string, title: string) => {
    const next = title.trim().slice(0, 32);
    if (!next) return;
    if (builtinBySlug(slug)) {
      commitLibrary((current) => ({ builtinTitles: { ...current.builtinTitles, [slug]: next } }));
      return;
    }
    commitLibrary((current) => ({
      studies: current.studies.map((item) => (item.slug === slug ? { ...item, title: next, updatedAt: Date.now() } : item)),
    }));
  }, [commitLibrary]);

  const deleteStudy = useCallback(
    (slug: string) => {
      const currentPath = location.pathname.replace(/^\//, "");
      const shouldLeave = currentPath === slug;
      const nextSlug = fallbackSlug(slug);

      if (builtinBySlug(slug)) {
        commitLibrary((current) => ({
          hiddenBuiltins: current.hiddenBuiltins.includes(slug) ? current.hiddenBuiltins : [...current.hiddenBuiltins, slug],
          builtinEdits: Object.fromEntries(Object.entries(current.builtinEdits).filter(([key]) => key !== slug)),
        }));
      } else {
        commitLibrary((current) => ({ studies: current.studies.filter((item) => item.slug !== slug) }));
      }

      if (job?.slug === slug) setJob(null);
      if (shouldLeave) navigate(`/${nextSlug}`);
    },
    [commitLibrary, fallbackSlug, job?.slug, location.pathname, navigate],
  );

  const requestDelete = useCallback((slug: string, title: string) => {
    setDeletePrompt({ slug, title });
  }, []);

  const closeDelete = useCallback(() => setDeletePrompt(null), []);

  const confirmDelete = useCallback(() => {
    if (!deletePrompt) return;
    const { slug } = deletePrompt;
    setDeletePrompt(null);
    deleteStudy(slug);
  }, [deletePrompt, deleteStudy]);

  const value = useMemo<StudioValue>(
    () => ({
      items,
      userStudies,
      spotlightOpen,
      session,
      job,
      openCreate,
      openEdit,
      closeSpotlight,
      submitSpotlight,
      remixStudy,
      copyStudy,
      renameStudy,
      deletePrompt,
      requestDelete,
      closeDelete,
      confirmDelete,
      syncConfigured,
      syncStatus,
    }),
    [
      closeDelete,
      closeSpotlight,
      confirmDelete,
      copyStudy,
      deletePrompt,
      items,
      job,
      openCreate,
      openEdit,
      remixStudy,
      renameStudy,
      requestDelete,
      session,
      spotlightOpen,
      submitSpotlight,
      syncConfigured,
      syncStatus,
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
