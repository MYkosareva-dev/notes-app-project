'use client'

import { useState } from 'react'
import type { Collection, Note } from '../lib/db'

type CollectionRowProps = {
  collection: Collection
  /** The notes inside this collection, already sorted. */
  notes: Note[]
  selected: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onSelect: () => void
  onOpenNote: (note: Note) => void
  onRequestDelete: () => void
}

export default function CollectionRow({
  collection,
  notes,
  selected,
  expanded,
  onToggleExpanded,
  onSelect,
  onOpenNote,
  onRequestDelete,
}: CollectionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-xl px-1 py-1 text-sm transition ${
          selected ? 'bg-accent-soft font-medium' : 'hover:bg-surface-muted'
        }`}
      >
        {/* The chevron only expands, so the tree can be browsed without
            changing what the main area is showing. */}
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${collection.name}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground"
        >
          <span
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {/* Clicking the name selects the collection and opens it, the way a
            folder behaves in an editor sidebar. */}
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          className="flex-1 truncate rounded-lg px-1 py-1 text-left"
          title={collection.name}
        >
          {collection.name}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={`Actions for ${collection.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground ${
              menuOpen ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
          >
            <span aria-hidden="true">⋯</span>
          </button>

          {menuOpen && (
            <>
              {/* Catches the next click anywhere else so the menu closes. */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onRequestDelete()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-soft"
                >
                  Delete collection
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <ul className="ml-4 border-l border-border pl-2">
          {notes.length === 0 ? (
            <li className="px-2 py-1.5 text-xs text-muted">
              No notes here yet
            </li>
          ) : (
            notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onOpenNote(note)}
                  title={note.title}
                  className="w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  {note.title}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  )
}
