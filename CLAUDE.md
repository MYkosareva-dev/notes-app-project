# CLAUDE.md — Notes App with Collections and Search

Project rules for the AI agent. Follow these on every task in this repository.

## What this project is

A notes app: notes grouped into collections (sidebar tree), cross-cutting tags with colours, and live search across all notes. Two-panel layout: sidebar (collections tree + tag filter) and a main area (card grid overview / note editor). Runs locally with `npm run dev`. No deployment, no authentication at this stage.

## Stack (fixed — never substitute or add)

- Next.js (App Router) + TypeScript
- Tailwind CSS (light + dark theme via `dark:` classes and colour tokens)
- Supabase through the `supabase-js` client ONLY

Prohibited in this project: Supabase MCP server, any auth (no sign-up/login/sessions), SQL migrations or schema changes from code, deployment configs, image upload / Supabase Storage, any other database client or ORM.

## Data access — the most important rule

1. ALL database reads and writes live in ONE module: `app/lib/db.ts`. Components never call `supabase` directly and never import the Supabase client — they import named functions from `app/lib/db.ts` (e.g. `getNotes`, `createCollection`, `setNoteTags`).
2. The Supabase client is created once in `app/lib/supabase.ts` and imported only by `app/lib/db.ts`.
3. Credentials come only from environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, loaded from `.env.local`. Never hardcode them, never commit `.env.local` (it is in `.gitignore`).
4. Every update to a note must also set `updated_at` to the current time — the database does not do this automatically.

## Database (already exists — do not create or alter tables)

Tables were created manually in the Supabase dashboard. The schema is documented in `docs/supabase-schema.md`. Never write migrations, never rename columns, never assume a column that is not listed there.

The relationships in plain language:
- A note can belong to one collection; a collection can contain many notes. A note may also have no collection (`collection_id` is empty) — such notes appear under "All notes".
- A note can carry several tags and a tag can apply to many notes. This many-to-many link lives in the `note_tags` join table: one row = one note–tag pair.
- Deleting a collection sets its notes' `collection_id` to empty (the database does this itself). Deleting a note or a tag removes its `note_tags` rows automatically.

Tables: `collections` (id, name, created_at) · `notes` (id, title, body, collection_id nullable, pinned, created_at, updated_at) · `tags` (id, name, color) · `note_tags` (note_id, tag_id).

## Behaviour rules

- Tag filter uses AND logic: with several tags selected, show only notes that carry EVERY selected tag — never "any of".
- Search matches note titles AND body text, updates as the user types, and respects the active tag filter.
- Deleting a collection asks the user: delete the folder only (notes move to "All notes") or delete the folder with all its notes (extra confirmation). Never delete notes silently.
- Every list view needs a readable empty state: empty collection, no search results, no tag matches. No blank screens.
- Sorting: pinned notes first, then by `updated_at` descending.

## UI conventions

- Style: light, rounded corners (rounded-xl/2xl), soft shadows, pastel accent colours, pill-shaped buttons and tag chips. Support light and dark theme from the start.
- Tags render as coloured pills/dots using each tag's `color` value.
- The sidebar contains ONLY: search context, "All notes" group, collections tree with note-count badges, "New collection" control, tag filter, theme toggle. No other sections.

## Workflow rules

- One feature per branch (`feature/<name>`); never commit directly to `main`.
- Small, descriptive commit messages ("Add tag filter with AND logic"), never "updates" or "stuff".
- When a task needs a supabase-js API you are not certain about, ask for the documentation snippet rather than guessing; cited references live in `docs/`.
- Do not install new dependencies without asking first.
- Do not touch `.env.local`, `docs/`, or this file unless explicitly asked.
