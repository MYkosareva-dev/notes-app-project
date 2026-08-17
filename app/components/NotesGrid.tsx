'use client'

import type { Note } from '../lib/db'
import NoteCard from './NoteCard'

export type EmptyState = {
  title: string
  description: string
  /** Label for the create-a-note button shown alongside the message. */
  action: string
}

type NotesGridProps = {
  notes: Note[]
  onOpen: (note: Note) => void
  onCreate: () => void
  creating: boolean
  /** Wording depends on what is selected — an empty collection reads
   *  differently from an empty "All notes". */
  emptyState: EmptyState
}

export default function NotesGrid({
  notes,
  onOpen,
  onCreate,
  creating,
  emptyState,
}: NotesGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <span className="text-3xl" aria-hidden="true">
          📝
        </span>
        <h2 className="text-lg font-medium">{emptyState.title}</h2>
        <p className="max-w-sm text-sm text-muted">{emptyState.description}</p>
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-contrast shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {emptyState.action}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onOpen={onOpen} />
      ))}
    </div>
  )
}
