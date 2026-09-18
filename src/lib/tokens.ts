/**
 * Visual language sampled from the public computed styles on
 * interfaces.show (Sept 2026). These are design tokens, not
 * component implementations.
 *
 * Type: Inter (UI), IBM Plex Serif (titles), Geist Mono (figures)
 * Surface: zinc-100 page #f4f4f5, white stage, 440× card, 28px radius
 * Ink: zinc-900 #18181b, zinc-600 #52525c, zinc-500 #71717b
 * Shadow: layered 4% #292929 stack + 1px hairline + inset lip
 * Motion: springs for state, linear loops for meters
 */
export const springs = {
  snappy: { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.8 },
  soft: { type: "spring" as const, stiffness: 240, damping: 28, mass: 0.9 },
  stamp: { type: "spring" as const, stiffness: 380, damping: 18, mass: 0.7 },
};

export const card = {
  width: 440,
  wide: 560,
  radius: 28,
};

export const breakpoints = {
  narrow: 768,
};
