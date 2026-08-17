'use client'

import { useEffect, useRef, useState } from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const noteWord = noteCount === 1 ? 'note' : 'notes'
  const isEmpty = noteCount === 0

  // Hand focus back to whatever opened the dialog once it closes.
  useEffect(() => {
    const opener = document.activeElement
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  // Put focus on the safe control, both on open and on changing step — without
  // this, advancing to step two would leave focus on a button that no longer
  // exists and drop it back to the document body.
  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLElement>('[data-initial-focus]')
      ?.focus()
  }, [confirmingDestructive])

  // Escape closes the dialog and Tab cycles inside it. This listens on the
  // document rather than on the overlay element, so it keeps working no matter
  // where focus currently sits.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (busy) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled])')
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const inside = active instanceof Node && dialog.contains(active)

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-collection-heading"
        aria-describedby="delete-collection-detail"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg"
      >
        {confirmingDestructive ? (
          <>
            <h2
              id="delete-collection-heading"
              className="text-lg font-semibold tracking-tight wrap-break-word text-danger"
            >
              Permanently delete {noteCount} {noteWord}?
            </h2>
            <p
              id="delete-collection-detail"
              className="mt-2 text-sm wrap-break-word text-muted"
            >
              “{collection.name}” and the {noteCount} {noteWord} inside it will
              be deleted for good. The {noteWord} cannot be recovered — they are
              not moved to “Uncollected”.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                data-initial-focus
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
              className="text-lg font-semibold tracking-tight wrap-break-word"
            >
              Delete “{collection.name}”?
            </h2>
            <p
              id="delete-collection-detail"
              className="mt-2 text-sm text-muted"
            >
              {isEmpty
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
                  {isEmpty ? 'Delete folder' : 'Delete folder only'}
                </span>
                <span className="block text-xs text-muted">
                  {isEmpty
                    ? 'Removes the empty folder.'
                    : `The ${noteWord} ${noteCount === 1 ? 'is' : 'are'} kept and ${noteCount === 1 ? 'moves' : 'move'} to “Uncollected”.`}
                </span>
              </button>

              {/* No second option for an empty collection — with no notes to
                  destroy it would do exactly what the button above does. */}
              {!isEmpty && (
                <button
                  type="button"
                  onClick={() => setConfirmingDestructive(true)}
                  disabled={busy}
                  className="rounded-xl border border-border bg-danger-soft px-4 py-3 text-left shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  <span className="block text-sm font-medium text-danger">
                    Delete folder and its notes
                  </span>
                  <span className="block text-xs text-muted">
                    Deletes the folder and permanently destroys {noteCount}{' '}
                    {noteWord}.
                  </span>
                </button>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                data-initial-focus
                onClick={onCancel}
                disabled={busy}
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
