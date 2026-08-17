'use client'

import { useEffect, useState } from 'react'
import {
  createCollection,
  createNote,
  deleteCollectionOnly,
  deleteCollectionWithNotes,
  deleteNote,
  getCollections,
  getNotes,
  setNoteCollection,
  updateNote,
  type Collection,
  type Note,
} from './lib/db'
import {
  notesForSelection,
  notesInCollection,
  notesWithoutCollection,
  sortCollections,
  sortNotes,
  type Selection,
} from './lib/notes'
import DeleteCollectionDialog from './components/DeleteCollectionDialog'
import NoteEditor from './components/NoteEditor'
import NotesGrid from './components/NotesGrid'
import Sidebar from './components/Sidebar'

function describe(caught: unknown) {
  return caught instanceof Error ? caught.message : String(caught)
}

export default function Home() {
  // `notes` deliberately holds every note, unfiltered. The sidebar tree, the
  // grid and the open note are all derived from it, so narrowing the view can
  // never make the note being edited disappear out from under the editor.
  const [notes, setNotes] = useState<Note[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selection, setSelection] = useState<Selection>({ kind: 'all' })
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  const [openNoteId, setOpenNoteId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)
  const [deletingCollection, setDeletingCollection] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initial load. The `active` flag drops the result if the component unmounted
  // while the requests were in flight (which React's development-mode double
  // invocation of effects makes routine).
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [loadedNotes, loadedCollections] = await Promise.all([
          getNotes(),
          getCollections(),
        ])
        if (active) {
          setNotes(loadedNotes)
          setCollections(loadedCollections)
        }
      } catch (caught) {
        if (active) setError(describe(caught))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  /**
   * Refetches everything. Used by the error banner's Retry button, and after a
   * failed collection delete — which passes `keepError` so the explanation of
   * what went wrong survives the refetch.
   */
  async function reload({ keepError = false } = {}) {
    setLoading(true)
    if (!keepError) setError(null)
    try {
      const [loadedNotes, loadedCollections] = await Promise.all([
        getNotes(),
        getCollections(),
      ])
      setNotes(loadedNotes)
      setCollections(loadedCollections)
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setLoading(false)
    }
  }

  const openNote = notes.find((note) => note.id === openNoteId) ?? null
  const visibleNotes = notesForSelection(notes, selection)
  const selectedCollection =
    selection.kind === 'collection'
      ? (collections.find((c) => c.id === selection.id) ?? null)
      : null

  function expand(collectionId: number) {
    setExpanded((current) => new Set(current).add(collectionId))
  }

  function toggleExpanded(collectionId: number) {
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(collectionId)) next.add(collectionId)
      return next
    })
  }

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      // A note made while a collection is selected belongs to it.
      const collectionId = selection.kind === 'collection' ? selection.id : null
      const created = await createNote({
        title: 'Untitled note',
        body: '',
        collection_id: collectionId,
      })
      setNotes((current) => sortNotes([created, ...current]))
      if (collectionId !== null) expand(collectionId)
      setOpenNoteId(created.id)
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setCreating(false)
    }
  }

  /** Returns the saved note, or null if the write failed, so the editor can
   *  keep the user's text on screen instead of navigating away from it. */
  async function handleSave(
    id: number,
    input: { title: string; body: string }
  ): Promise<Note | null> {
    setError(null)
    try {
      const saved = await updateNote(id, input)
      setNotes((current) =>
        sortNotes([saved, ...current.filter((note) => note.id !== id)])
      )
      return saved
    } catch (caught) {
      setError(describe(caught))
      return null
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    try {
      await deleteNote(id)
      setNotes((current) => current.filter((note) => note.id !== id))
      setOpenNoteId(null)
    } catch (caught) {
      setError(describe(caught))
    }
  }

  async function handleChangeCollection(
    noteId: number,
    collectionId: number | null
  ) {
    setError(null)
    try {
      const moved = await setNoteCollection(noteId, collectionId)
      setNotes((current) =>
        sortNotes([moved, ...current.filter((note) => note.id !== noteId)])
      )
      if (collectionId !== null) expand(collectionId)
    } catch (caught) {
      setError(describe(caught))
    }
  }

  async function handleCreateCollection(name: string): Promise<boolean> {
    setError(null)
    try {
      const created = await createCollection(name)
      setCollections((current) => sortCollections([...current, created]))
      return true
    } catch (caught) {
      setError(describe(caught))
      return false
    }
  }

  /** Drops a deleted collection from the sidebar state and stops showing it. */
  function forgetCollection(id: number) {
    setCollections((current) => current.filter((c) => c.id !== id))
    setExpanded((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    setSelection((current) =>
      current.kind === 'collection' && current.id === id
        ? { kind: 'all' }
        : current
    )
  }

  async function handleDeleteCollectionOnly(id: number) {
    setDeletingCollection(true)
    setError(null)
    try {
      await deleteCollectionOnly(id)
      // The database cleared `collection_id` itself (ON DELETE SET NULL);
      // mirror that locally so the notes show up under "Uncollected".
      setNotes((current) =>
        current.map((note) =>
          note.collection_id === id ? { ...note, collection_id: null } : note
        )
      )
      forgetCollection(id)
      setDeleteTarget(null)
    } catch (caught) {
      // Nothing was deleted, so local state is still accurate — just close the
      // dialog so the error banner behind it is readable.
      setError(describe(caught))
      setDeleteTarget(null)
    } finally {
      setDeletingCollection(false)
    }
  }

  async function handleDeleteCollectionWithNotes(id: number) {
    setDeletingCollection(true)
    setError(null)
    try {
      // Drop exactly the notes the database reports deleting, rather than
      // re-deriving the set from a local copy that may be out of date.
      const deletedIds = new Set(await deleteCollectionWithNotes(id))
      setNotes((current) => current.filter((note) => !deletedIds.has(note.id)))
      if (openNoteId !== null && deletedIds.has(openNoteId)) {
        setOpenNoteId(null)
      }
      forgetCollection(id)
      setDeleteTarget(null)
    } catch (caught) {
      // This operation is not atomic: the notes may already be gone while the
      // collection survives. Refetch so the sidebar can never keep offering
      // rows that no longer exist.
      setError(describe(caught))
      setDeleteTarget(null)
      await reload({ keepError: true })
    } finally {
      setDeletingCollection(false)
    }
  }

  const heading =
    selection.kind === 'all' ? 'Uncollected' : (selectedCollection?.name ?? '')

  const emptyState =
    selection.kind === 'all'
      ? {
          title: 'Nothing uncollected',
          description:
            'Notes that do not belong to a collection show up here. Start with a first thought — you can file it into a collection later.',
          action: 'New note',
        }
      : {
          title: 'This collection is empty',
          description: `Notes you create while “${selectedCollection?.name ?? ''}” is selected are filed here automatically.`,
          action: 'New note',
        }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar
        notes={notes}
        collections={collections}
        selection={selection}
        expanded={expanded}
        looseNoteCount={notesWithoutCollection(notes).length}
        onSelect={(next) => {
          setSelection(next)
          setOpenNoteId(null)
          if (next.kind === 'collection') expand(next.id)
        }}
        onToggleExpanded={toggleExpanded}
        onOpenNote={(note) => setOpenNoteId(note.id)}
        onCreateCollection={handleCreateCollection}
        onRequestDeleteCollection={setDeleteTarget}
      />

      <main className="flex flex-1 flex-col gap-5 p-5 sm:p-8">
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground shadow-sm transition hover:bg-surface-muted"
            >
              Retry
            </button>
          </div>
        )}

        {openNote ? (
          <NoteEditor
            key={openNote.id}
            note={openNote}
            collections={collections}
            onChangeCollection={handleChangeCollection}
            onSave={handleSave}
            onDelete={handleDelete}
            onBack={() => setOpenNoteId(null)}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {heading}
                </h1>
                <p className="text-sm text-muted">
                  {loading
                    ? 'Loading…'
                    : `${visibleNotes.length} ${visibleNotes.length === 1 ? 'note' : 'notes'} · double-click a card to open it`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {creating ? 'Creating…' : '+ New note'}
              </button>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="min-h-36 animate-pulse rounded-2xl border border-border bg-surface-muted"
                  />
                ))}
              </div>
            ) : (
              <NotesGrid
                notes={visibleNotes}
                onOpen={(note) => setOpenNoteId(note.id)}
                onCreate={() => void handleCreate()}
                creating={creating}
                emptyState={emptyState}
              />
            )}
          </>
        )}
      </main>

      {deleteTarget && (
        <DeleteCollectionDialog
          collection={deleteTarget}
          noteCount={notesInCollection(notes, deleteTarget.id).length}
          busy={deletingCollection}
          onDeleteOnly={() => void handleDeleteCollectionOnly(deleteTarget.id)}
          onDeleteWithNotes={() =>
            void handleDeleteCollectionWithNotes(deleteTarget.id)
          }
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
