// Runs on Node's built-in test runner — no dependencies to install:
//   npm test
//
// These cover app/lib/notes.ts only, which is pure and imports nothing at
// runtime (its import from db.ts is type-only, so no Supabase client is
// constructed and no environment variables are needed).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Collection, Note } from './db'
import {
  compareNotes,
  normaliseTitle,
  notesForSelection,
  notesInCollection,
  notesWithoutCollection,
  sortCollections,
  sortNotes,
} from './notes.ts'

function note(fields: Partial<Note> & { id: number }): Note {
  return {
    title: 'Note',
    body: null,
    collection_id: null,
    pinned: false,
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    ...fields,
  }
}

function collection(id: number, name: string): Collection {
  return { id, name, created_at: '2026-01-01T00:00:00+00:00' }
}

const ids = (notes: Note[]) => notes.map((n) => n.id)

describe('normaliseTitle', () => {
  it('trims surrounding whitespace', () => {
    assert.equal(normaliseTitle('  Meeting notes  '), 'Meeting notes')
  })

  it('falls back for an empty or whitespace-only title', () => {
    assert.equal(normaliseTitle(''), 'Untitled note')
    assert.equal(normaliseTitle('   '), 'Untitled note')
    assert.equal(normaliseTitle('\n\t'), 'Untitled note')
  })

  it('leaves an ordinary title untouched', () => {
    assert.equal(normaliseTitle('Hello'), 'Hello')
  })
})

describe('compareNotes', () => {
  const older = note({ id: 1, updated_at: '2026-03-01T09:00:00+00:00' })
  const newer = note({ id: 2, updated_at: '2026-03-01T10:00:00+00:00' })

  it('orders the more recently updated note first', () => {
    assert.ok(compareNotes(newer, older) < 0)
    assert.ok(compareNotes(older, newer) > 0)
  })

  it('treats equal timestamps as equal', () => {
    assert.equal(compareNotes(older, note({ ...older, id: 9 })), 0)
  })

  it('compares across offset formats, since the app writes Z and the database returns +00:00', () => {
    const z = note({ id: 3, updated_at: '2026-03-01T10:00:00.000Z' })
    const offset = note({ id: 4, updated_at: '2026-03-01T09:00:00+00:00' })
    assert.ok(compareNotes(z, offset) < 0)
  })
})

describe('sortNotes', () => {
  it('sorts newest edit first', () => {
    const sorted = sortNotes([
      note({ id: 1, updated_at: '2026-01-01T00:00:00+00:00' }),
      note({ id: 2, updated_at: '2026-03-01T00:00:00+00:00' }),
      note({ id: 3, updated_at: '2026-02-01T00:00:00+00:00' }),
    ])
    assert.deepEqual(ids(sorted), [2, 3, 1])
  })

  it('does not mutate its input', () => {
    const input = [
      note({ id: 1, updated_at: '2026-01-01T00:00:00+00:00' }),
      note({ id: 2, updated_at: '2026-03-01T00:00:00+00:00' }),
    ]
    sortNotes(input)
    assert.deepEqual(ids(input), [1, 2])
  })

  it('handles empty and single-item lists', () => {
    assert.deepEqual(sortNotes([]), [])
    assert.deepEqual(ids(sortNotes([note({ id: 7 })])), [7])
  })
})

describe('sortCollections', () => {
  it('sorts alphabetically regardless of case', () => {
    const sorted = sortCollections([
      collection(1, 'work'),
      collection(2, 'Archive'),
      collection(3, 'ideas'),
    ])
    assert.deepEqual(
      sorted.map((c) => c.name),
      ['Archive', 'ideas', 'work']
    )
  })

  it('does not mutate its input', () => {
    const input = [collection(1, 'work'), collection(2, 'Archive')]
    sortCollections(input)
    assert.deepEqual(
      input.map((c) => c.name),
      ['work', 'Archive']
    )
  })
})

describe('grouping notes by collection', () => {
  const notes = [
    note({ id: 1, collection_id: null }),
    note({ id: 2, collection_id: 10 }),
    note({ id: 3, collection_id: 20 }),
    note({ id: 4, collection_id: 10 }),
  ]

  it('notesWithoutCollection returns only notes outside every collection', () => {
    assert.deepEqual(ids(notesWithoutCollection(notes)), [1])
  })

  it('notesInCollection returns only that collection', () => {
    assert.deepEqual(ids(notesInCollection(notes, 10)), [2, 4])
  })

  it('notesInCollection returns nothing for an unknown collection', () => {
    assert.deepEqual(notesInCollection(notes, 999), [])
  })

  it('preserves the incoming order, so a sorted list stays sorted', () => {
    const sorted = sortNotes([
      note({ id: 1, collection_id: 10, updated_at: '2026-01-01T00:00:00+00:00' }),
      note({ id: 2, collection_id: 10, updated_at: '2026-03-01T00:00:00+00:00' }),
      note({ id: 3, collection_id: 10, updated_at: '2026-02-01T00:00:00+00:00' }),
    ])
    assert.deepEqual(ids(notesInCollection(sorted, 10)), [2, 3, 1])
  })

  it('does not mutate its input', () => {
    notesWithoutCollection(notes)
    notesInCollection(notes, 10)
    assert.deepEqual(ids(notes), [1, 2, 3, 4])
  })
})

describe('notesForSelection', () => {
  const notes = [
    note({ id: 1, collection_id: null }),
    note({ id: 2, collection_id: 10 }),
    note({ id: 3, collection_id: 20 }),
  ]

  it('the "Uncollected" selection shows notes with no collection', () => {
    assert.deepEqual(ids(notesForSelection(notes, { kind: 'all' })), [1])
  })

  it('a collection selection shows that collection', () => {
    assert.deepEqual(
      ids(notesForSelection(notes, { kind: 'collection', id: 20 })),
      [3]
    )
  })

  it('agrees with the tree, which is the reason this helper exists', () => {
    // The sidebar tree renders notesInCollection; the grid renders
    // notesForSelection. They must never disagree about a collection.
    assert.deepEqual(
      ids(notesForSelection(notes, { kind: 'collection', id: 10 })),
      ids(notesInCollection(notes, 10))
    )
  })

  it('returns an empty list for an empty collection', () => {
    assert.deepEqual(notesForSelection(notes, { kind: 'collection', id: 99 }), [])
  })
})
