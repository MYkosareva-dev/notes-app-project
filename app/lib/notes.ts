// Pure note logic, no database access — the rules that both app/lib/db.ts and
// the UI have to agree on. Keeping them here means there is one definition to
// change rather than two that can silently drift apart.

import type { Note } from './db'

/** A note always gets a visible title, so lists never render a blank card. */
export function normaliseTitle(title: string): string {
  return title.trim() || 'Untitled note'
}

/**
 * The one sort order in the app: most recently updated first.
 *
 * CLAUDE.md also requires pinned notes above the rest; pinning is not built
 * yet, and when it is, this comparator is the only place that changes.
 */
export function compareNotes(a: Note, b: Note): number {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
}

/** Returns a new sorted array — never mutates the input. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(compareNotes)
}
