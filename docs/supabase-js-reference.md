# supabase-js Reference (cited)

Snippets used by `app/lib/supabase.ts` and `app/lib/db.ts`. Taken from the official
Supabase JavaScript client documentation.

## Sources

- Initializing the client — https://supabase.com/docs/reference/javascript/initializing
- Select / insert / update / delete queries — https://supabase.com/docs/reference/javascript/select

## Creating the client

Source: https://supabase.com/docs/reference/javascript/initializing

```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Queries

Source: https://supabase.com/docs/reference/javascript/select

Read all rows, ordered:

```ts
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .order('updated_at', { ascending: false })
```

Insert one row and get it back:

```ts
const { data, error } = await supabase
  .from('notes')
  .insert({ title, body })
  .select()
  .single()
```

Update one row by id (note: `updated_at` is set by the app, not the database):

```ts
const { data, error } = await supabase
  .from('notes')
  .update({ title, body, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single()
```

Delete one row by id:

```ts
const { error } = await supabase.from('notes').delete().eq('id', id)
```

## House rule

Every call destructures `{ data, error }` and every `error` is surfaced — the helpers in
`app/lib/db.ts` throw on error, so no database failure passes unnoticed.
