'use client'

import { useState } from 'react'
import type { Collection } from '../lib/db'

type CollectionPickerProps = {
  collections: Collection[]
  value: number | null
  /** Persisted immediately on selection. */
  onChange: (collectionId: number | null) => Promise<void>
}

const NO_COLLECTION = ''

export default function CollectionPicker({
  collections,
  value,
  onChange,
}: CollectionPickerProps) {
  const [busy, setBusy] = useState(false)

  async function handleChange(raw: string) {
    setBusy(true)
    try {
      await onChange(raw === NO_COLLECTION ? null : Number(raw))
    } finally {
      setBusy(false)
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span>Collection</span>
      <select
        value={value === null ? NO_COLLECTION : String(value)}
        onChange={(event) => void handleChange(event.target.value)}
        disabled={busy}
        aria-label="Collection this note belongs to"
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground shadow-sm outline-none transition hover:bg-surface-muted focus:border-accent disabled:opacity-60"
      >
        <option value={NO_COLLECTION}>No collection</option>
        {collections.map((collection) => (
          <option key={collection.id} value={String(collection.id)}>
            {collection.name}
          </option>
        ))}
      </select>
      {busy && <span>Saving…</span>}
    </label>
  )
}
