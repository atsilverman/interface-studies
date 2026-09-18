# Interface Studies

A playground for original interactive UI in a zinc / Inter / Motion language.

Theme: [`DESIGN.md`](./DESIGN.md) (source of truth). Cursor always loads `.cursor/rules/interface-studies.mdc`.

```bash
npm install
npm run dev
```

Open the local URL. Defcon is the built study. Playback sits on the stage dock. A monitor / phone toggle on the stage switches desktop (scaled) and mobile (stacked) layouts; landscape studies stay landscape and ask you to rotate on a portrait phone. **+** or ⌘K files a new brief. A row’s **⋯** remixes, renames, edits, or deletes.

The deployed gallery does not call an LLM from the browser. Do not put secrets in `src/`, `VITE_*`, or localStorage.

**Cursor API key (later, for + / remix on the live site):** create a user key at [cursor.com/dashboard/api](https://cursor.com/dashboard/api). Store it as `CURSOR_API_KEY` in a gitignored `.env` locally, then in Vercel Project Settings → Environment Variables (and GitHub Actions secrets if you add CI). Copy `.env.example` to `.env`. Never commit `.env`.
