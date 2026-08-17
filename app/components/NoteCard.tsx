'use client'

import type { Note } from '../lib/db'

type NoteCardProps = {
  note: Note
  onOpen: (note: Note) => void
}

function formatUpdated(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function NoteCard({ note, onOpen }: NoteCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      title="Double-click to open"
      onDoubleClick={() => onOpen(note)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(note)
        }
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <h3 className="line-clamp-2 font-medium leading-snug">
        {note.title || 'Untitled note'}
      </h3>
      <p className="line-clamp-3 text-sm text-muted">
        {note.body?.trim() ? note.body : 'No content yet'}
      </p>
      <span className="mt-auto pt-2 text-xs text-muted">
        Updated {formatUpdated(note.updated_at)}
      </span>
    </article>
  )
}
