// Pure note logic, no database access — the rules that both app/lib/db.ts and
// the UI have to agree on. Keeping them here means there is one definition to
// change rather than two that can silently drift apart.

import type { Collection, Note } from './db'

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

/**
 * Collections are listed alphabetically. The query orders them too, but the
 * sidebar re-sorts after adding one, and both paths must agree — Postgres
 * collation and `localeCompare` do not order mixed case identically.
 */
export function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
}

/** What the sidebar has selected, and therefore what the grid shows. */
export type Selection = { kind: 'all' } | { kind: 'collection'; id: number }

/** Notes that sit outside every collection — the "Uncollected" group. */
export function notesWithoutCollection(notes: Note[]): Note[] {
  return notes.filter((note) => note.collection_id === null)
}

export function notesInCollection(notes: Note[], id: number): Note[] {
  return notes.filter((note) => note.collection_id === id)
}

/**
 * The notes a selection shows. The sidebar tree and the main grid both go
 * through this, so a collection can never list one set of notes in the tree
 * and a different set in the grid. Filtering preserves the incoming order,
 * so the result stays sorted.
 */
export function notesForSelection(
  notes: Note[],
  selection: Selection
): Note[] {
  return selection.kind === 'all'
    ? notesWithoutCollection(notes)
    : notesInCollection(notes, selection.id)
}
