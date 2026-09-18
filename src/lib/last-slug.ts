export const LAST_SLUG_KEY = "silverman-studio-last-slug";

export function readLastSlug() {
  try {
    return localStorage.getItem(LAST_SLUG_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function rememberSlug(slug: string) {
  try {
    localStorage.setItem(LAST_SLUG_KEY, slug);
  } catch {
    /* private mode */
  }
}

export function pickHomeSlug(
  last: string,
  items: { slug: string }[],
  userStudies: { slug: string; updatedAt: number }[],
) {
  if (last && userStudies.some((study) => study.slug === last)) return last;
  const newest = [...userStudies].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (newest) return newest.slug;
  if (last && items.some((item) => item.slug === last)) return last;
  return items[0]?.slug ?? "defcon";
}
