'use client'

import { useSyncExternalStore } from 'react'

/**
 * Toggles the `dark` class on <html> and remembers the choice in localStorage.
 * The class on <html> is the single source of truth — it is set before first
 * paint by the inline script in app/layout.tsx — so this component reads it
 * rather than keeping a duplicate copy in state.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => false // server render: assume light, the client corrects it on hydration
  )

  function toggle() {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // localStorage unavailable — the theme still applies for this session
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex w-full items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm transition hover:bg-surface-muted"
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Dark' : 'Light'} theme</span>
    </button>
  )
}
