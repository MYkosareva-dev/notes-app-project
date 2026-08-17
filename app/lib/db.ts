// The ONLY module that talks to the database (see CLAUDE.md).
// Components import named functions from here and never touch the Supabase client.
// Query reference: docs/supabase-js-reference.md

import { supabase } from './supabase'

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

/** All notes, newest edit first. Pinned-first sorting arrives in a later phase. */
export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) fail('getNotes', error)
  return data ?? []
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
    .insert({ title: input.title, body: input.body ?? '' })
    .select()
    .single()

  if (error) fail('createNote', error)
  return data
}

/** Every update also stamps `updated_at` — the database does not do it for us. */
export async function updateNote(
  id: number,
  input: UpdateNoteInput
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...input, updated_at: new Date().toISOString() })
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
