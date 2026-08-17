'use client'

import { useState } from 'react'

type NewCollectionFormProps = {
  /** Resolves true when the collection was created. */
  onCreate: (name: string) => Promise<boolean>
}

export default function NewCollectionForm({
  onCreate,
}: NewCollectionFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  function close() {
    setOpen(false)
    setName('')
  }

  async function submit() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      // Keep the typed name on screen if the write failed, so it is not lost.
      if (await onCreate(name)) close()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-dashed border-border px-3 py-2 text-left text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
      >
        + New collection
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="flex flex-col gap-2"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
        placeholder="Collection name"
        aria-label="New collection name"
        autoFocus
        disabled={busy}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent disabled:opacity-60"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-contrast shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm shadow-sm transition hover:bg-surface-muted disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
