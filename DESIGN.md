# Design language

Canonical theme for Interface Studies. Read this before writing or restyling a study. Implement with `StageCard`, Tailwind zinc, and `springs` from `src/lib/tokens.ts`. Do not invent a parallel type scale or color system.

Sampled from public computed styles on interfaces.show (Sept 2026). Original pieces only — never clone that site’s widgets.

## Stack

React + TypeScript + Tailwind CSS v4 + Motion (`motion/react`). Playground chrome icons: Lucide.

## Chrome

- Page: `bg-zinc-100` `#f4f4f5`. Stage: white `rounded-xl`.
- Widget: `StageCard`. Default `w-[440px]`. Agent / data tools may use `wide` (`w-[560px]`). On the mobile layout, the card is `w-full` up to 400px.
- Card: `card.radius` 28px, `bg-zinc-100 shadow-heavy`. Inner well: white, inset `card.inset` 10px (8px compact).
- Nested rounds are **concentric**: `nestedRadius(outer, inset)` → `max(0, outer − inset)`. The white well is 18px (20px compact), not `rounded-2xl` / 16px. A too-small inner radius makes the grey gutter thicker at the corner than along the edges. `StageCard` already applies this. If a study nests another rounded rectangle inside a rounded parent with a uniform gutter, use the same formula — do not pick `rounded-xl` / `rounded-2xl` by habit. Pills (`rounded-full`) are exempt.
- Header: 15px medium title, 12.5px `text-zinc-400` meta, 10px pill badge.
- Footer: 11px `text-zinc-400`, one quiet line.
- Padding in the well: `px-5 pt-4 pb-4`.

## Type

| Role | Face | Tailwind | Size / tracking |
| --- | --- | --- | --- |
| Sidebar title | IBM Plex Serif | `font-serif` | `text-3xl tracking-tighter` |
| Sidebar subtitle | IBM Plex Serif | `font-serif` | `text-base tracking-tight text-zinc-600` |
| UI | Inter | `font-sans` | 13–15px `tracking-tight` or `tracking-tighter` |
| Figures, clock, codes | Geist Mono | `font-mono` | 10–28px, `tabular-nums` on clocks |

Weight 400 by default. 500 only on card titles and player names. No bold display type.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| Page / card shell | `#f4f4f5` zinc-100 | Backgrounds |
| Ink | `#18181b` zinc-900 | Titles, primary figures |
| Muted | `#52525c` zinc-600 | Serif subtitles |
| Quiet | `#71717b` zinc-500 | Inactive nav, default badges |
| Hint | zinc-400 | Meta, footnotes, ticks |
| Hairline | zinc-200 / zinc-100 | Dividers, tracks |
| Live | emerald-600 / 500 / 50 | Running status only |
| Hit / complete | emerald-600 / 500 / 50 | Threshold reached |

One accent per study besides zinc. Live status: emerald pill + 1.6s opacity blink on a 6px dot. Do not rainbow.

## Motion

Import `springs` from `src/lib/tokens.ts`.

- `springs.snappy` — list rows, +1 counts, chips in.
- `springs.soft` — bars, layout, traveling marks, desktop ↔ mobile morph.
- `springs.stamp` — threshold / unlock.
- Linear loops only for meters, clocks, live blink.
- No bounce-cartoon, no large layout jumps, no default 300ms ease everywhere.
- Desktop ↔ mobile is a **morph**, not a cut or a fade of the whole card. Keep one tree. `StageCard` already layout-animates. Pieces that change place (player vs clock, row vs stack) wrap in `StageMorph` with a stable `id` (`layoutId`). Do not remount the study on toggle.

Play / pause / reset sit top-right of the stage (`useStageDock` + `StageControls`). On a phone they sit as a left floating cluster (same zinc-100/blur ring as **+**). The desktop ↔ mobile toggle sits bottom-right of the stage on wide screens only. On a phone there is no layout toggle — always the mobile composition. **+** is a matching floating disc, bottom-right. They are not part of the study object. In-object controls use `IconButton` only when they belong to the metaphor. No speed chips.

## Stage dock vs the study

Two layers. Do not mix them.

**The study** (inside `StageCard`) is the designed object — what would exist if the widget were embedded in a product, driven by real time or real data. Clock faces, progress, live/hit badges, copy, and in-metaphor controls (a keypad, a tonearm, a toggle that *is* the UI) stay here.

**Playback chrome** (next to the monitor / phone toggle) is playground transport for previewing time. Play / pause, reset. Register with `useStageDock` from `src/lib/stage-dock.tsx`. The buttons hide when a study does not register. Draft / queued stubs do not show them.

Ask: *Would this control exist if the widget were live in a product, not being demoed?* If no, it belongs on the playback chrome. Never put speed chips or transport buttons inside `StageCard`.

## Composition

- One object per study. Generous white. Quiet labels.
- Dummy data, self-contained. Time-based studies still animate in the card; transport lives on the dock.
- Physical metaphor or a small tool — not a product page.
- Built studies live under `src/interfaces/` and register in `src/lib/catalog.ts`.
- The left-rail **+** / ⌘K overlay is for new briefs. With `CURSOR_API_KEY` on the server it starts a Cursor agent and mounts the generated study. Without the key it only files a stub.
- Row **⋯** : Edit (in place), Remix (clone then prompt), Copy (clone only — mounts the same builtin Component), Rename, Delete (type the study title to confirm).

## Studio chrome

- Sidebar title **Interface Studies**. Subtitle: a playground for original interface design.
- Default route `/defcon`. Only original studies in the nav.
- Runtime overlay cycles filing statuses (`FILE_STEPS` / `EDIT_STEPS` / `REMIX_STEPS` in `catalog.ts`) with a progress bar. It does not compile a study.
- Stage playback sits top-right of the stage when a study registers. Hidden otherwise. Same `size-9` hit targets. Lucide `Play` / `Pause` / `RotateCcw`. Hover: play emerald, pause amber, reset red. Reset while playing restarts the clock and keeps running. On a phone the same controls are a left floating cluster (`size-11`, zinc-100/blur ring, `shadow-heavy`).
- Library cloud save lives on the **stage**, top left, on desktop. On a phone it sits in the header top-right (where play / reset used to be) — cloud icon, spinning loader while saving, brief emerald splash when the write lands. Status only; not a control.
- Stage layout: auto / desktop / mobile on **wide** screens. Monitor and phone icons on the stage toggle, **bottom right** of the stage. On a narrow screen the toggle is omitted and the study always uses the mobile composition. + is a floating zinc-900 disc, bottom-right of the stage, with a zinc-100/blur ring and `shadow-heavy`. The study is **centered** in the remaining well, with padding so it never sits under the floating clusters. The page is `h-dvh` and does not scroll; the stage well does if the card is taller. Click the active explicit mode again to return to auto.
- Left rail library (copies, remixes, titles) can periodic-sync to free Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Stage layout stays on this device. Last write wins. No realtime.

## Stage layout (desktop vs mobile)

Two presentations of the same study. Same zinc, type, springs, and `StageCard`. Do not invent a second visual language for phones.

**Desktop layout** is the designed composition at 440 / 560. If the stage is narrower than that, it **scales down** to fit. No CSS-rotate / “turn your phone” mode.

**Mobile layout** is a rearranged composition for a narrow column: stack, larger tap targets, full-width card. Every study has both layouts in one component (`layout` + `StageMorph`). Auto: wide screens use desktop, narrow screens use mobile. The monitor / phone toggle is offered on wide screens only. A phone always shows the mobile layout.

The monitor / phone toggle overrides auto. Persist in `localStorage`. Switching interpolates shared pieces (Keynote Magic Move): card width, clock, names, bar. Verify the morph in the browser, not only the settled layouts.

## Deployed site

The public gallery does not put API secrets in the browser. `CURSOR_API_KEY` stays server-only in gitignored `.env` and Vercel env. `+` / remix / edit call `/api/study`, which starts a Cursor cloud agent and returns TSX. The client compiles that source and stores it in the library (and Supabase if configured). Do not prefix the key with `VITE_`.

## Remix and edit

Copy and Remix clone a **new nav row** that mounts the same builtin Component (independent clock / state). Copy stops there. Remix then opens the prompt. The source stays in the rail either way. A + stub has no Component yet, so Copy of a stub stays a stub.

A live HTML/Vite site can remount shipped components and **runtime-compile** studies returned by `/api/study`. It still cannot write `src/interfaces/*.tsx` into the production git bundle from the browser. Built-ins stay in this repo; generated studies live in the library blob.

Edit prompts on the same study. No new row. Built studies stay on this file until an agent rewrites them; the overlay still records the direction.

Iterations stay on this file: `StageCard`, zinc, Inter / IBM Plex Serif / Geist Mono, `springs`. Do not change chrome, type, palette, or motion unless the user explicitly demands a departure in the prompt.

## Do not

- Clone interfaces.show (Agent Run, Agent Calls, Agent Handoff, Vinyl Player, Toast Capsule, charts, …).
- New fonts, heavy shadows, glassmorphism, or a second palette.
- Skip `StageCard` for a full-bleed custom frame unless the user asks.
