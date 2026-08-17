'use client'

import { useEffect, useState } from 'react'
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
  type Note,
} from './lib/db'
import NoteEditor from './components/NoteEditor'
import NotesGrid from './components/NotesGrid'
import Sidebar from './components/Sidebar'

function describe(caught: unknown) {
  return caught instanceof Error ? caught.message : String(caught)
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openNoteId, setOpenNoteId] = useState<number | null>(null)

  // Initial load. State is only touched after the await so the effect does not
  // trigger a cascading render on mount.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await getNotes()
        if (active) setNotes(data)
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

  /** Used by the error banner's Retry button. */
  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setNotes(await getNotes())
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setLoading(false)
    }
  }

  const openNote = notes.find((note) => note.id === openNoteId) ?? null

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const created = await createNote({ title: 'Untitled note', body: '' })
      setNotes((current) => [created, ...current])
      setOpenNoteId(created.id)
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(id: number, input: { title: string; body: string }) {
    setError(null)
    try {
      const saved = await updateNote(id, input)
      // Re-sort locally: the fresh updated_at moves this note to the front.
      setNotes((current) =>
        [saved, ...current.filter((note) => note.id !== id)].sort(
          (a, b) => b.updated_at.localeCompare(a.updated_at)
        )
      )
    } catch (caught) {
      setError(describe(caught))
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

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar noteCount={notes.length} />

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
            onSave={handleSave}
            onDelete={handleDelete}
            onBack={() => setOpenNoteId(null)}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  All notes
                </h1>
                <p className="text-sm text-muted">
                  {loading
                    ? 'Loading…'
                    : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · double-click a card to open it`}
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
                    className="h-32 animate-pulse rounded-2xl border border-border bg-surface-muted"
                  />
                ))}
              </div>
            ) : (
              <NotesGrid
                notes={notes}
                onOpen={(note) => setOpenNoteId(note.id)}
                onCreate={() => void handleCreate()}
                creating={creating}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
