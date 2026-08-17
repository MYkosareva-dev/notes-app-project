// The ONLY module that talks to the database (see CLAUDE.md).
// Components import named functions from here and never touch the Supabase client.
// Query reference: docs/supabase-js-reference.md

import { supabase } from './supabase'
import { normaliseTitle, sortCollections, sortNotes } from './notes'

/** A row of the `notes` table — see docs/supabase-schema.md */
export type Note = {
  id: number
  title: string
  body: string | null
  collection_id: number | null
  pinned: boolean
  created_at: string
  updated_at: string
}

/** A row of the `collections` table — see docs/supabase-schema.md */
export type Collection = {
  id: number
  name: string
  created_at: string
}

export type CreateNoteInput = {
  title: string
  body?: string
  /** Omit or pass null to create the note outside any collection. */
  collection_id?: number | null
}

export type UpdateNoteInput = {
  title?: string
  body?: string
}

/** Turns a Supabase error into a thrown Error so nothing fails silently. */
function fail(action: string, error: { message: string }): never {
  throw new Error(`${action} failed: ${error.message}`)
}

/**
 * All notes, newest edit first. The database does the ordering, but the result
 * still goes through `sortNotes` so that this list and any list the UI re-sorts
 * after an edit are guaranteed to use the same comparator.
 */
export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) fail('getNotes', error)
  return sortNotes(data ?? [])
}

export async function getNote(id: number): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) fail(`getNote(${id})`, error)
  return data
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: normaliseTitle(input.title),
      body: input.body ?? '',
      collection_id: input.collection_id ?? null,
    })
    .select()
    .single()

  if (error) fail('createNote', error)
  return data
}

/**
 * Every update also stamps `updated_at` — the database does not do it for us.
 *
 * Columns are listed one by one rather than spread from `input`, so a caller
 * can never write a field this function did not intend to expose.
 */
export async function updateNote(
  id: number,
  input: UpdateNoteInput
): Promise<Note> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.title !== undefined) patch.title = normaliseTitle(input.title)
  if (input.body !== undefined) patch.body = input.body

  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) fail(`updateNote(${id})`, error)
  return data
}

export async function deleteNote(id: number): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)

  if (error) fail(`deleteNote(${id})`, error)
}

/**
 * Moves a note into a collection, or out of every collection when passed null.
 * Like any other note write, this re-stamps `updated_at`.
 */
export async function setNoteCollection(
  noteId: number,
  collectionId: number | null
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({
      collection_id: collectionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) fail(`setNoteCollection(${noteId})`, error)
  return data
}

// --- collections ----------------------------------------------------------

export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('name')

  if (error) fail('getCollections', error)
  return sortCollections(data ?? [])
}

export async function createCollection(name: string): Promise<Collection> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('A collection needs a name')

  const { data, error } = await supabase
    .from('collections')
    .insert({ name: trimmed })
    .select()
    .single()

  if (error) fail('createCollection', error)
  return data
}

/**
 * Deletes the collection row and nothing else. Its notes survive: the foreign
 * key is ON DELETE SET NULL, so the database clears their `collection_id`
 * itself and they reappear under "Uncollected". Do not clear it from here.
 */
export async function deleteCollectionOnly(id: number): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id)

  if (error) fail(`deleteCollectionOnly(${id})`, error)
}

/**
 * Deletes every note in the collection and then the collection itself, and
 * returns the ids of the notes that were actually deleted.
 *
 * Notes go first: once the collection row is gone the database has already
 * cleared `collection_id`, and there would be no way left to find them.
 *
 * The ids are read before deleting rather than deleting by `collection_id`
 * directly, for three reasons. The caller learns exactly which rows to drop
 * from its own state instead of re-deriving them from a possibly stale copy;
 * re-running after a failure deletes the same set and nothing more; and a note
 * moved into this collection by someone else in the meantime survives and
 * lands in "Uncollected" rather than being destroyed without being counted.
 *
 * There is no transaction — supabase-js cannot open one, and CLAUDE.md rules
 * out an RPC. If the second step fails the notes are already gone, so the
 * thrown error names which step failed and the caller must refetch.
 */
export async function deleteCollectionWithNotes(id: number): Promise<number[]> {
  const { data: rows, error: selectError } = await supabase
    .from('notes')
    .select('id')
    .eq('collection_id', id)

  if (selectError)
    fail(`deleteCollectionWithNotes(${id}) [find notes]`, selectError)

  const noteIds: number[] = (rows ?? []).map((row: { id: number }) => row.id)

  if (noteIds.length > 0) {
    const { error: notesError } = await supabase
      .from('notes')
      .delete()
      .in('id', noteIds)

    if (notesError)
      fail(`deleteCollectionWithNotes(${id}) [delete notes]`, notesError)
  }

  const { error } = await supabase.from('collections').delete().eq('id', id)

  if (error) {
    fail(
      `deleteCollectionWithNotes(${id}) [delete collection, ${noteIds.length} note(s) already deleted]`,
      error
    )
  }

  return noteIds
}
