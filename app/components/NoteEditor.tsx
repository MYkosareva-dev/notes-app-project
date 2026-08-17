'use client'

import { useState } from 'react'
import type { Note } from '../lib/db'

type NoteEditorProps = {
  note: Note
  /** Resolves to the saved note, or to null if the save failed. */
  onSave: (
    id: number,
    input: { title: string; body: string }
  ) => Promise<Note | null>
  onDelete: (id: number) => Promise<void>
  onBack: () => void
}

export default function NoteEditor({
  note,
  onSave,
  onDelete,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body ?? '')
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isDirty = title !== note.title || body !== (note.body ?? '')

  /** Returns whether the note reached the database. */
  async function save(): Promise<boolean> {
    setBusy(true)
    try {
      const saved = await onSave(note.id, { title, body })
      if (!saved) return false
      // Adopt what was actually stored — db.ts normalises the title, so without
      // this the local copy would differ from the row and `isDirty` would stay
      // true forever.
      setTitle(saved.title)
      setBody(saved.body ?? '')
      return true
    } finally {
      setBusy(false)
    }
  }

  async function saveAndGoBack() {
    // Stay in the editor when the save failed, otherwise unmounting here would
    // throw away the text the user just wrote.
    if (isDirty && !(await save())) return
    onBack()
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await onDelete(note.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={saveAndGoBack}
          disabled={busy}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
        >
          ← All notes
        </button>

        <span className="text-xs text-muted">
          {busy ? 'Saving…' : isDirty ? 'Unsaved changes' : 'All changes saved'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy || !isDirty}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-contrast shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-danger shadow-sm transition hover:bg-danger-soft disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <div className="rounded-2xl border border-border bg-danger-soft p-4 shadow-sm">
          <p className="text-sm font-medium">
            Delete “{note.title || 'Untitled note'}”? This cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={busy}
              className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-danger-contrast shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              Delete note
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note title"
          aria-label="Note title"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Start writing…"
          aria-label="Note body"
          className="min-h-[50vh] w-full flex-1 resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted"
        />
      </div>
    </div>
  )
}
