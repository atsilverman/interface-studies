import { Defcon } from "../interfaces/Defcon";

export const SITE = {
  title: "Interface Studies",
  tagline: "A playground for original interface design.",
};

export const builtins = [
  {
    slug: "defcon",
    title: "Defcon",
    category: "Pitch",
    Component: Defcon,
    prompt:
      "Premier League defender DefCon tracker. Minutes clock synced to uneven CBIT progress, 1×–10× speed, emerald Live blink, Hit at 10.",
    fit: "landscape" as const,
    frame: "wide" as const,
  },
] as const;

export type Builtin = (typeof builtins)[number];

export type UserStudy = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  basePrompt: string;
  directions: string[];
  remixOf?: string;
  remixOfTitle?: string;
  createdAt: number;
  updatedAt: number;
};

export type NavItem = {
  slug: string;
  title: string;
  category: string;
  building?: boolean;
  builtin?: boolean;
  remix?: boolean;
};

export type SourceStudy = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  basePrompt: string;
  directions: string[];
  builtin: boolean;
};

export function groupNav(items: NavItem[]) {
  const order: string[] = [];
  const map = new Map<string, NavItem[]>();
  for (const item of items) {
    if (!map.has(item.category)) {
      order.push(item.category);
      map.set(item.category, []);
    }
    map.get(item.category)!.push(item);
  }
  return order.map((category) => ({ category, items: map.get(category)! }));
}

export function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "study"
  );
}

export function uniqueSlug(base: string, taken: string[]) {
  const root = slugify(base);
  if (!taken.includes(root)) return root;
  let n = 2;
  while (taken.includes(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export function remixTitle(source: string, existingTitles: string[]) {
  const root = source.replace(/ remix(?: \d+)?$/i, "").trim() || source;
  const base = `${root} remix`;
  if (!existingTitles.includes(base)) return base;
  let n = 2;
  while (existingTitles.includes(`${root} remix ${n}`)) n += 1;
  return `${root} remix ${n}`;
}

export function composePrompt(basePrompt: string, directions: string[]) {
  if (directions.length === 0) return basePrompt;
  return [basePrompt, ...directions.map((note, index) => `Remix ${index + 1}: ${note}`)].join("\n\n");
}

export function inferCategory(text: string, fallback = "Studio") {
  const lower = text.toLowerCase();
  if (/premier|league|football|soccer|fpl|defcon|defender|player|match|pitch|goal/.test(lower)) return "Pitch";
  if (/agent|llm|handoff|tool call/.test(lower)) return "Agents";
  if (/clock|timer|meter|progress/.test(lower)) return "Meters";
  if (/pay|wallet|money|bank/.test(lower)) return "Money";
  return fallback;
}

export function deriveStudy(prompt: string, taken: string[]) {
  const text = prompt.trim().replace(/\s+/g, " ");
  const stop = new Set(["a", "an", "the", "that", "this", "with", "for", "and", "or", "of", "to", "in", "on", "my", "me", "we", "it"]);
  const words = text.split(" ").filter((word) => word.length > 1 && !stop.has(word.toLowerCase()));
  const title = (
    words
      .slice(0, 3)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") || "New study"
  ).slice(0, 32);

  return {
    title,
    slug: uniqueSlug(title, taken),
    category: inferCategory(text),
    prompt: text,
  };
}

export function builtinBySlug(slug: string) {
  return builtins.find((item) => item.slug === slug);
}

export const BUILD_STEPS = [
  "Reading brief",
  "Resolving tokens",
  "Choosing layout",
  "Applying type scale",
  "Wiring motion springs",
  "Mounting StageCard",
  "Registering catalog",
] as const;

export const EDIT_STEPS = [
  "Reading brief",
  "Keeping layout",
  "Updating copy",
  "Preserving type scale",
  "Wiring motion springs",
  "Mounting StageCard",
  "Saving catalog",
] as const;

export const REMIX_STEPS = [
  "Reading original",
  "Keeping type scale",
  "Preserving zinc palette",
  "Applying remix brief",
  "Wiring motion springs",
  "Mounting StageCard",
  "Registering catalog",
] as const;
