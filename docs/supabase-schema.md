# Supabase Schema — Notes App
> Source: created manually in the Supabase dashboard (Table Editor), project: Mid-Sprint2-Project (Supabase, EU region).
> This file documents the live schema. The application code must never create or alter tables.

## Tables

### `collections`
| Column | Type | Constraints / Default |
|---|---|---|
| `id` | int8 | primary key, identity |
| `name` | text | not null |
| `created_at` | timestamptz | default `now()` |

### `notes`
| Column | Type | Constraints / Default |
|---|---|---|
| `id` | int8 | primary key, identity |
| `title` | text | not null |
| `body` | text | nullable |
| `collection_id` | int8 | nullable, FK → `collections.id`, ON DELETE **SET NULL** |
| `pinned` | bool | not null, default `false` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` — app code must set it on every update |

### `tags`
| Column | Type | Constraints / Default |
|---|---|---|
| `id` | int8 | primary key, identity |
| `name` | text | not null |
| `color` | text | nullable (hex colour from the app palette) |
| `created_at` | timestamptz | default `now()` |

### `note_tags` (join table)
| Column | Type | Constraints / Default |
|---|---|---|
| `id` | int8 | primary key, identity |
| `note_id` | int8 | not null, FK → `notes.id`, ON DELETE **CASCADE** |
| `tag_id` | int8 | not null, FK → `tags.id`, ON DELETE **CASCADE** |
| `created_at` | timestamptz | default `now()` |

## Relationships in plain language

- A note can belong to one collection; a collection can contain many notes. `collection_id` may be empty — such a note sits outside any collection and appears under "All notes".
- A note can carry several tags, and one tag can apply to many notes. Each row in `note_tags` links exactly one note to one tag.
- Deleting a collection does NOT delete its notes: the database clears their `collection_id` (SET NULL).
- Deleting a note or a tag automatically removes its rows in `note_tags` (CASCADE).

## Access notes

- Row Level Security is **disabled** on all four tables (no authentication at this stage; the app uses the anon key).
- Credentials: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (git-ignored).
