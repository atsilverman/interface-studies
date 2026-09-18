# Interface Studies

A playground for original interactive UI in a zinc / Inter / Motion language.

Theme: [`DESIGN.md`](./DESIGN.md) (source of truth). Cursor always loads `.cursor/rules/interface-studies.mdc`.

```bash
npm install
npm run dev
```

Open the local URL. Defcon is the built study. Play / reset sit top-right of the stage. On a phone they float bottom-left (same ring as **+**, which sits bottom-right). The monitor / phone toggle is desktop-only; a phone always shows the mobile layout. Cloud save sits top-left of the stage on desktop and in the header on a phone. Auto uses desktop on a wide screen and mobile on a phone. **+** or ⌘K builds a new study when `CURSOR_API_KEY` is set on the server (`/api/study`). Without the key it only files a brief. A row’s **⋯** edits in place, remixes (clone then prompt), copies (same live component, new row), renames, or deletes.

The deployed gallery does not call an LLM from the browser. Do not put secrets in `src/`, `VITE_*`, or localStorage.

**Cursor API key (for + / remix / edit on this machine and the live site):** create a user key at [cursor.com/dashboard/api](https://cursor.com/dashboard/api). Store it as `CURSOR_API_KEY` in gitignored `.env` locally, then the same name in Vercel Project Settings → Environment Variables (Production, Preview, Development). Never prefix it with `VITE_`. Restart `npm run dev` after adding it. The overlay’s Build button calls `/api/study`, which starts a Cursor cloud agent and mounts the generated study in your library.

**Library sync (optional, free Supabase):** copies / remixes / titles stay in `localStorage` until you add a project.

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor → paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Project Settings → API → copy **Project URL** and **anon public** key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Same names in Vercel env, then redeploy.
4. Restart `npm run dev`. The stage shows a cloud chip (spinner while saving). Last write wins, about every 60s plus a couple of seconds after an edit. Desktop/mobile stage toggle does not sync.
