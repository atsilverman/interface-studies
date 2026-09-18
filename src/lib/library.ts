import { type StudyBuild, type UserStudy } from "./catalog";

export const LIBRARY_KEY = "silverman-studio-library";

export type Library = {
  studies: UserStudy[];
  builtinTitles: Record<string, string>;
  hiddenBuiltins: string[];
  builtinEdits: Record<string, string[]>;
  builtinBuilds: Record<string, StudyBuild>;
  updatedAt: number;
};

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
    cloneOf: typeof item.cloneOf === "string" ? item.cloneOf : undefined,
    copied: Boolean(item.copied),
    source: typeof item.source === "string" ? item.source : undefined,
    agentId: typeof item.agentId === "string" ? item.agentId : undefined,
    runId: typeof item.runId === "string" ? item.runId : undefined,
    buildError: typeof item.buildError === "string" ? item.buildError : undefined,
    createdAt: item.createdAt ?? Date.now(),
    updatedAt: item.updatedAt ?? item.createdAt ?? Date.now(),
  };
}

export function emptyLibrary(): Library {
  return { studies: [], builtinTitles: {}, hiddenBuiltins: [], builtinEdits: {}, builtinBuilds: {}, updatedAt: 0 };
}

function parseBuilds(raw: unknown): Record<string, StudyBuild> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, StudyBuild> = {};
  for (const [slug, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const item = value as StudyBuild;
    out[slug] = {
      source: typeof item.source === "string" ? item.source : undefined,
      agentId: typeof item.agentId === "string" ? item.agentId : undefined,
      runId: typeof item.runId === "string" ? item.runId : undefined,
      error: typeof item.error === "string" ? item.error : undefined,
    };
  }
  return out;
}

function hasLocalWork(library: Omit<Library, "updatedAt">) {
  return (
    library.studies.length > 0 ||
    library.hiddenBuiltins.length > 0 ||
    Object.keys(library.builtinTitles).length > 0 ||
    Object.keys(library.builtinEdits).length > 0 ||
    Object.keys(library.builtinBuilds).length > 0
  );
}

export function parseLibrary(raw: unknown): Library | null {
  if (raw == null) return emptyLibrary();
  if (Array.isArray(raw)) {
    const studies = raw.map(migrateStudy).filter((item): item is UserStudy => item !== null);
    return { studies, builtinTitles: {}, hiddenBuiltins: [], builtinEdits: {}, builtinBuilds: {}, updatedAt: studies.length ? Date.now() : 0 };
  }
  if (typeof raw !== "object") return null;
  const data = raw as Partial<Library>;
  const studies = Array.isArray(data.studies) ? data.studies.map(migrateStudy).filter((item): item is UserStudy => item !== null) : [];
  const builtinTitles = data.builtinTitles && typeof data.builtinTitles === "object" ? data.builtinTitles : {};
  const hiddenBuiltins = Array.isArray(data.hiddenBuiltins) ? data.hiddenBuiltins.filter((slug) => typeof slug === "string") : [];
  const builtinEdits =
    data.builtinEdits && typeof data.builtinEdits === "object"
      ? Object.fromEntries(
          Object.entries(data.builtinEdits).filter(
            (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((note) => typeof note === "string"),
          ),
        )
      : {};
  const builtinBuilds = parseBuilds(data.builtinBuilds);
  const next = { studies, builtinTitles, hiddenBuiltins, builtinEdits, builtinBuilds };
  const updatedAt = typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt) ? data.updatedAt : hasLocalWork(next) ? Date.now() : 0;
  return { ...next, updatedAt };
}

export function loadLibrary(): Library {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return emptyLibrary();
    return parseLibrary(JSON.parse(raw) as unknown) ?? emptyLibrary();
  } catch {
    return emptyLibrary();
  }
}

export function saveLibrary(library: Library) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function touchLibrary(current: Library, patch: Partial<Omit<Library, "updatedAt">>): Library {
  return {
    studies: patch.studies ?? current.studies,
    builtinTitles: patch.builtinTitles ?? current.builtinTitles,
    hiddenBuiltins: patch.hiddenBuiltins ?? current.hiddenBuiltins,
    builtinEdits: patch.builtinEdits ?? current.builtinEdits,
    builtinBuilds: patch.builtinBuilds ?? current.builtinBuilds,
    updatedAt: Date.now(),
  };
}
