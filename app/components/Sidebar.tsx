'use client'

import type { Collection, Note } from '../lib/db'
import { notesInCollection, type Selection } from '../lib/notes'
import CollectionRow from './CollectionRow'
import NewCollectionForm from './NewCollectionForm'
import ThemeToggle from './ThemeToggle'

type SidebarProps = {
  /** Every note, unfiltered — the tree groups them itself. */
  notes: Note[]
  collections: Collection[]
  selection: Selection
  expanded: ReadonlySet<number>
  looseNoteCount: number
  onSelect: (selection: Selection) => void
  onToggleExpanded: (collectionId: number) => void
  onOpenNote: (note: Note) => void
  onCreateCollection: (name: string) => Promise<boolean>
  onRequestDeleteCollection: (collection: Collection) => void
}

/**
 * Phase 2 sidebar: the "Uncollected" group, the collections tree, the
 * "New collection" control and the theme toggle. Search and the tag filter
 * arrive in later phases.
 */
export default function Sidebar({
  notes,
  collections,
  selection,
  expanded,
  looseNoteCount,
  onSelect,
  onToggleExpanded,
  onOpenNote,
  onCreateCollection,
  onRequestDeleteCollection,
}: SidebarProps) {
  const allSelected = selection.kind === 'all'

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 border-b border-border bg-surface p-4 sm:w-72 sm:border-b-0 sm:border-r sm:p-5">
      <div className="px-2 text-lg font-semibold tracking-tight">Notes</div>

      <nav className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => onSelect({ kind: 'all' })}
          aria-current={allSelected ? 'page' : undefined}
          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
            allSelected
              ? 'bg-accent-soft font-medium'
              : 'hover:bg-surface-muted'
          }`}
        >
          <span>Uncollected</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted shadow-sm">
            {looseNoteCount}
          </span>
        </button>

        {collections.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {collections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                notes={notesInCollection(notes, collection.id)}
                selected={
                  selection.kind === 'collection' &&
                  selection.id === collection.id
                }
                expanded={expanded.has(collection.id)}
                onToggleExpanded={() => onToggleExpanded(collection.id)}
                onSelect={() =>
                  onSelect({ kind: 'collection', id: collection.id })
                }
                onOpenNote={onOpenNote}
                onRequestDelete={() => onRequestDeleteCollection(collection)}
              />
            ))}
          </ul>
        )}

        <NewCollectionForm onCreate={onCreateCollection} />
      </nav>

      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  )
}
