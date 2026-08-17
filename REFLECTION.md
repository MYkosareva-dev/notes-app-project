# REFLECTION.md

## Phase 1 — Scaffold + Notes CRUD (branch `feature/notes-crud`)

### What went wrong / friction during the riskiest phase

- **`next dev` silently rewrote CLAUDE.md.** Next 16 appends a `nextjs-agent-rules` block to CLAUDE.md on every start. Fix: `agentRules: false` in `next.config.ts`, file restored via `git checkout`, verified it stays clean across restarts. Lesson: tooling can mutate agent-rule files — worth checking CLAUDE.md diffs after introducing any new tool.
- **Non-empty directory scaffold.** `create-next-app` refuses a directory with existing files (CLAUDE.md, docs/), so the app was scaffolded into a temporary folder and moved into the repo root, merging .gitignore entries.
- **Next 16 typing friction.** `LayoutProps<"/">` only resolves after Next generates its types, so standalone `tsc` failed — replaced with an explicit `children` type. The new `react-hooks/set-state-in-effect` lint rule rejected mount effects; initial load now touches state only after its `await`, and the theme toggle reads the `dark` class via `useSyncExternalStore` instead of mirroring it in state.
- **Tailwind v4 has no `tailwind.config.ts`** — dark mode is configured with `@custom-variant dark` directly in `globals.css`.
- **Known minor quirk: ~1s clock skew.** The app stamps `updated_at` (per CLAUDE.md rule) while `created_at` is server-defaulted, so a note edited within a second of creation can get `updated_at` slightly earlier than `created_at`. Accepted as inherent to the app-stamps rule, not a bug.

### Review commands run on the PR diff

- Third-party command: `/full-review` (wshobson/commands) — finding: a failed save silently destroyed the user's text. `handleSave` caught its own error and resolved normally, so `saveAndGoBack` navigated back unconditionally, the editor unmounted and local state was lost; the error banner's Retry even refetched the pre-edit row. Found independently by three of the five review agents.
- Action taken: fixed on the same branch before merging (`onSave` now reports failure and `saveAndGoBack` stays put on error), together with a second critical (`isDirty` compared raw input against the normalised saved title, leaving the editor permanently "unsaved"), a duplicated sort order that would have broken pinned-first in a later phase, and an AA contrast failure on the dark-theme delete button.
- Deliberately deferred: unit tests (not required at this stage of the sprint; noted as a follow-up once the Phase 2 UI settles).

## Phase 2 — Collections (to be filled)
- Added zero-dependency node --test coverage for the pure helpers (20 tests) after the
  review argued the risk had grown: Phase 2 introduced permanent data destruction while
  the verification gate had stayed the same.

## Phase 3 — Tags (to be filled)

## Phase 4 — Search (to be filled)

## Optional tasks (to be filled)

- Optional task 1: colour-coded tags — …
- Optional task 2: note count badges — …

## Fresh-session diff review (to be filled)

- PR: … · Finding: …
