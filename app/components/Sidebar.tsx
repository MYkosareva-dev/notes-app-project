import ThemeToggle from './ThemeToggle'

type SidebarProps = {
  noteCount: number
}

/**
 * Phase 1 sidebar: the "All notes" group and the theme toggle.
 * Search, the collections tree and the tag filter arrive in later phases.
 */
export default function Sidebar({ noteCount }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 border-b border-border bg-surface p-4 sm:w-64 sm:border-b-0 sm:border-r sm:p-5">
      <div className="px-2 text-lg font-semibold tracking-tight">Notes</div>

      <nav>
        <div
          aria-current="page"
          className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-foreground"
        >
          <span>All notes</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted shadow-sm">
            {noteCount}
          </span>
        </div>
      </nav>

      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  )
}
