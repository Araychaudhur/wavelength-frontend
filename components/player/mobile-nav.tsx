"use client"

import { Home, Search, Library, Music2 } from "lucide-react"

interface MobileNavProps {
  currentView: 'search' | 'library' | 'now-playing'
  setCurrentView: (view: 'search' | 'library' | 'now-playing') => void
}

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Library, label: "Library" },
  { icon: Music2, label: "Playlists" },
]

export function MobileNav({ currentView, setCurrentView }: MobileNavProps) {
  return (
    <nav
      className="flex shrink-0 items-center justify-around border-t border-border bg-player-surface px-2 py-2 pb-6 md:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const isActive = (item.label === 'Home' || item.label === 'Search') && currentView === 'search' ||
                         (item.label === 'Library' || item.label === 'Playlists') && currentView === 'library';
        
        return (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors hover:text-foreground ${
              isActive ? 'text-foreground bg-slate-800' : 'text-muted-foreground'
            }`}
            aria-label={item.label}
            onClick={() => {
              if (item.label === 'Home' || item.label === 'Search') setCurrentView('search');
              if (item.label === 'Library' || item.label === 'Playlists') setCurrentView('library');
            }}
          >
            <item.icon className="size-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  )
}
