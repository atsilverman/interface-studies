# Design language

Canonical theme for Interface Studies. Read this before writing or restyling a study. Implement with `StageCard`, Tailwind zinc, and `springs` from `src/lib/tokens.ts`. Do not invent a parallel type scale or color system.

Sampled from public computed styles on interfaces.show (Sept 2026). Original pieces only — never clone that site’s widgets.

## Stack

React + TypeScript + Tailwind CSS v4 + Motion (`motion/react`).

## Chrome

- Page: `bg-zinc-100` `#f4f4f5`. Stage: white `rounded-xl`.
- Widget: `StageCard`. Default `w-[440px]`. Agent / data tools may use `wide` (`w-[560px]`). On the mobile layout, the card is `w-full` up to 400px.
- Card: `rounded-[28px] bg-zinc-100 shadow-heavy`. Inner well: `rounded-2xl bg-white`.
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
- Desktop ↔ mobile is a **morph**, not a cut or a fade of the whole card. Keep one tree. `StageCard` and `StageDock` already layout-animate. Pieces that change place (player vs clock, row vs stack) wrap in `StageMorph` with a stable `id` (`layoutId`). Do not remount the study on toggle.

Play / pause / reset and 1×–10× speed are **stage dock** controls (`useStageDock` + `StageDock`). They are not part of the study object. In-object controls use `IconButton` only when they belong to the metaphor.

## Stage dock vs the study

Two layers. Do not mix them.

**The study** (inside `StageCard`) is the designed object — what would exist if the widget were embedded in a product, driven by real time or real data. Clock faces, progress, live/hit badges, copy, and in-metaphor controls (a keypad, a tonearm, a toggle that *is* the UI) stay here.

**The stage dock** (below the card, on the white stage) is playground transport for previewing time. Play / pause, reset, 1×–10×. Register with `useStageDock` from `src/lib/stage-dock.tsx`. The dock hides when a study does not register. Draft / queued stubs do not show it.

Ask: *Would this control exist if the widget were live in a product, not being demoed?* If no, it belongs on the dock. Never put speed chips or transport buttons inside `StageCard`.

## Composition

- One object per study. Generous white. Quiet labels.
- Dummy data, self-contained. Time-based studies still animate in the card; transport lives on the dock.
- Physical metaphor or a small tool — not a product page.
- Built studies live under `src/interfaces/` and register in `src/lib/catalog.ts`.
- The left-rail **+** / ⌘K overlay is for new briefs. It names and files a stub immediately; the real Motion study is still built in chat.
- Row **⋯** : Remix (clone), Rename, Edit brief or Iterate, Delete. Remix preserves the original; Iterate prompts on the copy.

## Studio chrome

- Sidebar title **Interface Studies**. Subtitle: a playground for original interface design.
- Default route `/defcon`. Only original studies in the nav.
- Runtime overlay cycles high-level build statuses (`BUILD_STEPS` / `REMIX_STEPS` in `catalog.ts`) with a progress bar. Fake is fine.
- Stage dock sits under the card when a study registers playback. Hidden otherwise.
- Stage layout: auto / desktop / mobile. Monitor and phone icons on the stage toggle. Click the active explicit mode again to return to auto.

## Stage layout (desktop vs mobile)

Two presentations of the same study. Same zinc, type, springs, and `StageCard`. Do not invent a second visual language for phones.

**Desktop layout** is the designed composition at 440 / 560. On a small screen it **scales down** to fit the stage. Landscape studies (`fit: "landscape"` in `catalog.ts`) stay landscape. In portrait, show the rotate hint and keep the scaled desktop study until the user switches to mobile.

**Mobile layout** is a rearranged composition for a narrow column: stack, larger tap targets, full-width card. Register `fit` on each builtin (`landscape` | `portrait` | `fluid`). Auto: wide screens use desktop; landscape studies on phones use scaled desktop; fluid/portrait studies on phones use mobile.

The monitor / phone toggle overrides auto. Persist in `localStorage`. Switching interpolates shared pieces (Keynote Magic Move): card width, clock, names, bar, dock. Verify the morph in the browser, not only the settled layouts.

## Deployed site

The public gallery does not call an LLM from the browser. Prompt overlay files local stubs; real studies are committed in this repo. **Do not store API keys in the client**, `VITE_*` env, or localStorage. Those values are public. Keys live as `CURSOR_API_KEY` in gitignored `.env` locally and in the host env UI (Vercel / GitHub) later — never in `src/`.

## Remix

Remix is a clone, not an overwrite. The source stays in the rail. The copy keeps the parent brief and accepts a new direction.

Iterations stay on this file: `StageCard`, zinc, Inter / IBM Plex Serif / Geist Mono, `springs`. Do not change chrome, type, palette, or motion unless the user explicitly demands a departure in the prompt.

## Do not

- Clone interfaces.show (Agent Run, Agent Calls, Agent Handoff, Vinyl Player, Toast Capsule, charts, …).
- New fonts, heavy shadows, glassmorphism, or a second palette.
- Skip `StageCard` for a full-bleed custom frame unless the user asks.
