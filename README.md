# Notes

A local notes app: notes grouped into collections, cross-cutting coloured tags,
and live search across everything. Two panels — a sidebar for navigation and
filtering, and a main area that shows either a grid of note cards or the editor.

Built with Next.js (App Router) + TypeScript, Tailwind CSS, and Supabase through
the `supabase-js` client. Light and dark themes are supported throughout.

## Running it

Requires Node 20+ and a `.env.local` in the project root holding the Supabase
project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then:

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000. There is no deployment step and no
authentication — this is a local development project.

## How it is organised

- `app/lib/supabase.ts` — creates the Supabase client, once. Imported only by `db.ts`.
- `app/lib/db.ts` — the single module that reads from and writes to the database.
  Components import named functions from here and never touch the client directly.
- `app/lib/notes.ts` — pure note logic (sort order, title normalisation) shared
  between the data layer and the UI.
- `app/components/` — the sidebar, note grid, note card, editor, and theme toggle.
- `docs/` — the live database schema and cited `supabase-js` references.

The database schema is documented in [docs/supabase-schema.md](docs/supabase-schema.md).
Tables are managed by hand in the Supabase dashboard; the app never creates or
alters them.

Project rules for contributors — and for AI agents working in this repository —
are in [CLAUDE.md](CLAUDE.md).

## Status

Notes CRUD is in place. Collections, tags, search, and pinned-note sorting are
being added in later phases.
