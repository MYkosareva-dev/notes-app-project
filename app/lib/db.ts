// The ONLY module that talks to the database (see CLAUDE.md).
// Components import named functions from here and never touch the Supabase client.
// Query reference: docs/supabase-js-reference.md

import { supabase } from './supabase'
import { normaliseTitle, sortNotes } from './notes'

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

export type CreateNoteInput = {
  title: string
  body?: string
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
    .insert({ title: normaliseTitle(input.title), body: input.body ?? '' })
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
