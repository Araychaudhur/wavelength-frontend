"use client"

import { Home, Search, Library, Music2, Plus, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

interface SidebarProps {
  currentView: 'search' | 'library' | 'now-playing'
  setCurrentView: (view: 'search' | 'library' | 'now-playing') => void
  refreshLibrary: () => Promise<void>
}

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Library, label: "Library" },
]

interface Playlist {
  id: string
  name: string
  description: string
  thumbnail_url: string
  is_auto_playlist: boolean
  song_count: number
}

export function Sidebar({ currentView, setCurrentView, refreshLibrary }: SidebarProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")

  // Fetch playlists from API
  const fetchPlaylists = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists`, {
        headers: {
          "ngrok-skip-browser-warning": "69420"
        }
      })
      const data = await response.json()
      if (data.status === "success") {
        setPlaylists(data.data)
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportPlaylist = async () => {
    if (!importUrl.trim()) return
    
    setIsImporting(true)
    try {
      console.log('Attempting to import playlist:', importUrl)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/import_playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({ url: importUrl }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response error:', response.status, errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Import response:', data)
      
      if (data.status === "success") {
        // Close modal and refresh playlists using the passed function
        setIsImportModalOpen(false)
        setImportUrl("")
        await refreshLibrary()
        
        // Show success message (you can implement toast notification here)
        console.log(`Successfully imported "${data.data.playlist_name}" with ${data.data.imported_songs} songs`)
      } else {
        console.error("Import failed:", data.message)
        // Show more detailed error to user
        alert(`Import failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Error importing playlist:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error importing playlist: ${errorMessage}`)
    } finally {
      setIsImporting(false)
    }
  }

  // Create new playlist
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDescription
        }),
      })
      
      const data = await response.json()
      if (data.status === "success") {
        setNewPlaylistName("")
        setNewPlaylistDescription("")
        setShowCreateModal(false)
        fetchPlaylists() // Refresh playlists
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
    }
  }

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists()
  }, [])
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:w-72">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pt-6 pb-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <Music2 className="size-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Wavelength
        </h1>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-6 pb-2">
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => {
            if (item.label === 'Search' || item.label === 'Library') {
              const isActive = (item.label === 'Search' && currentView === 'search') || 
                           (item.label === 'Library' && currentView === 'library')
              
              return (
                <li key={item.label}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-foreground" 
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                    aria-label={item.label}
                    onClick={() => setCurrentView(item.label.toLowerCase() as 'search' | 'library')}
                  >
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            }
            
            return (
              <li key={item.label}>
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label={item.label}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Playlists */}
      <div className="flex flex-1 flex-col overflow-hidden px-3 pt-4">
        <div className="flex items-center justify-between px-3 pb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Playlists
          </h2>
          <div className="flex gap-1">
            <button
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Import playlist"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Download className="size-4" />
            </button>
            <button
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Create new playlist"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading playlists...</div>
          ) : (
            <ul className="flex flex-col gap-0.5 pr-3 pb-4" role="list">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button 
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    onClick={() => setCurrentView('library')}
                  >
                    <Music2 className="size-4 shrink-0 opacity-50" />
                    <span className="truncate">{playlist.name}</span>
                    {playlist.song_count > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">{playlist.song_count}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md mb-3 bg-background text-foreground"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md mb-4 bg-background text-foreground resize-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Playlist Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-semibold mb-4">Import YouTube Music Playlist</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Paste a YouTube Music playlist URL to import all its tracks.
            </p>
            <input
              type="url"
              placeholder="https://music.youtube.com/playlist?list=PL..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md mb-4 bg-background text-foreground"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsImportModalOpen(false)
                  setImportUrl("")
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={handleImportPlaylist}
                disabled={!importUrl.trim() || isImporting}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
