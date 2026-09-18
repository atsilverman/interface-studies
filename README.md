# Interface Studies

A playground for original interactive UI in a zinc / Inter / Motion language.

Theme: [`DESIGN.md`](./DESIGN.md) (source of truth). Cursor always loads `.cursor/rules/interface-studies.mdc`.

```bash
npm install
npm run dev
```

Open the local URL. Defcon is the built study. Play / reset sit next to the monitor / phone toggle. That toggle switches desktop (wide) and mobile (stacked) layouts of the same study. Auto uses desktop on a wide screen and mobile on a phone. **+** or ⌘K files a new brief. A row’s **⋯** edits in place, remixes (clone then prompt), copies (same live component, new row), renames, or deletes.

The deployed gallery does not call an LLM from the browser. Do not put secrets in `src/`, `VITE_*`, or localStorage.

**Cursor API key (later, for + / remix on the live site):** create a user key at [cursor.com/dashboard/api](https://cursor.com/dashboard/api). Store it as `CURSOR_API_KEY` in a gitignored `.env` locally, then in Vercel Project Settings → Environment Variables (and GitHub Actions secrets if you add CI). Copy `.env.example` to `.env`. Never commit `.env`.

**Library sync (optional, free Supabase):** copies / remixes / titles stay in `localStorage` until you add a project.

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor → paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Project Settings → API → copy **Project URL** and **anon public** key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Same names in Vercel env, then redeploy.
4. Restart `npm run dev`. The stage shows a cloud chip (spinner while saving). Last write wins, about every 60s plus a couple of seconds after an edit. Desktop/mobile stage toggle does not sync.
