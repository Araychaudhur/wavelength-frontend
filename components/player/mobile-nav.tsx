"use client"

import { Home, Search, Library, Music2 } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Library, label: "Library" },
  { icon: Music2, label: "Playlists" },
]

export function MobileNav() {
  return (
    <nav
      className="flex shrink-0 items-center justify-around border-t border-border bg-player-surface px-2 py-2 md:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => (
        <button
          key={item.label}
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={item.label}
        >
          <item.icon className="size-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
