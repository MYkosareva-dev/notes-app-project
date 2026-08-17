'use client'

import { useState } from 'react'
import type { Collection } from '../lib/db'

type DeleteCollectionDialogProps = {
  collection: Collection
  /** How many notes live in this collection right now. */
  noteCount: number
  onDeleteOnly: () => void
  onDeleteWithNotes: () => void
  onCancel: () => void
  busy: boolean
}

/**
 * Deleting a collection is never silent: the first step offers the two
 * outcomes side by side, and the destructive one has to be confirmed again on
 * a second screen that spells out how many notes are about to be lost.
 */
export default function DeleteCollectionDialog({
  collection,
  noteCount,
  onDeleteOnly,
  onDeleteWithNotes,
  onCancel,
  busy,
}: DeleteCollectionDialogProps) {
  const [confirmingDestructive, setConfirmingDestructive] = useState(false)
  const noteWord = noteCount === 1 ? 'note' : 'notes'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-collection-heading"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg"
      >
        {confirmingDestructive ? (
          <>
            <h2
              id="delete-collection-heading"
              className="text-lg font-semibold tracking-tight text-danger"
            >
              Permanently delete {noteCount} {noteWord}?
            </h2>
            <p className="mt-2 text-sm text-muted">
              “{collection.name}” and the {noteCount} {noteWord} inside it will
              be deleted for good. The {noteWord} cannot be recovered — they are
              not moved to “All notes”.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDestructive(false)}
                disabled={busy}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onDeleteWithNotes}
                disabled={busy}
                className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-danger-contrast shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {busy
                  ? 'Deleting…'
                  : `Yes, delete the folder and ${noteCount} ${noteWord}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="delete-collection-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Delete “{collection.name}”?
            </h2>
            <p className="mt-2 text-sm text-muted">
              {noteCount === 0
                ? 'This collection is empty.'
                : `It holds ${noteCount} ${noteWord}. Choose what happens to ${noteCount === 1 ? 'it' : 'them'}.`}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onDeleteOnly}
                disabled={busy}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-left shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
              >
                <span className="block text-sm font-medium">
                  Delete folder only
                </span>
                <span className="block text-xs text-muted">
                  {noteCount === 0
                    ? 'Removes the empty folder.'
                    : `The ${noteWord} ${noteCount === 1 ? 'is' : 'are'} kept and ${noteCount === 1 ? 'moves' : 'move'} to “All notes”.`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  noteCount === 0
                    ? onDeleteOnly()
                    : setConfirmingDestructive(true)
                }
                disabled={busy}
                className="rounded-xl border border-border bg-danger-soft px-4 py-3 text-left shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                <span className="block text-sm font-medium text-danger">
                  Delete folder and its notes
                </span>
                <span className="block text-xs text-muted">
                  {noteCount === 0
                    ? 'There are no notes to delete.'
                    : `Deletes the folder and permanently destroys ${noteCount} ${noteWord}.`}
                </span>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                autoFocus
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
