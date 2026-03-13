"use client"

import { Search, Play, Clock, ListPlus, MoreVertical, Heart, Music2, PlayIcon, ListMusic } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useState, FormEvent, useRef, useEffect, Dispatch, SetStateAction } from "react"
import type { ReactNode } from 'react';
import type { NextPage } from 'next';

interface Playlist {
  id: string
  name: string
  description: string
  thumbnail_url: string
  is_auto_playlist: boolean
  song_count: number
}

interface MainContentProps {
  currentSong: any
  setCurrentSong: (song: any) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  togglePlayPause: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  searchResults: any[]
  setSearchResults: (results: any[]) => void
  playNewStation: (song: any) => Promise<void>
  playFromQueue: (index: number) => void
  currentView: 'search' | 'library' | 'now-playing'
  setCurrentView: (view: 'search' | 'library' | 'now-playing') => void
  librarySongs: any[]
  isLibraryLoading: boolean
  activeQueue: any[]
  setActiveQueue: Dispatch<SetStateAction<any[]>>
  queueIndex: number
  setQueueIndex: Dispatch<SetStateAction<number>>
  playlists: any[]
  setPlaylists: (playlists: any[]) => void
  selectedPlaylist: any
  setSelectedPlaylist: (playlist: any) => void
  playlistSongs: any[]
  setPlaylistSongs: (songs: any[]) => void
  isPlaylistLoading: boolean
  setIsPlaylistLoading: (loading: boolean) => void
  showPlaylistView: boolean
  setShowPlaylistView: (show: boolean) => void
  refreshLibrary: () => Promise<void>
}

export function MainContent({ currentSong, setCurrentSong, isPlaying, setIsPlaying, togglePlayPause, audioRef, searchResults, setSearchResults, playNewStation, playFromQueue, currentView, setCurrentView, librarySongs, isLibraryLoading, activeQueue, setActiveQueue, queueIndex, setQueueIndex, playlists, setPlaylists, selectedPlaylist, setSelectedPlaylist, playlistSongs, setPlaylistSongs, isPlaylistLoading, setIsPlaylistLoading, showPlaylistView, setShowPlaylistView, refreshLibrary }: MainContentProps) {
  const [searchInput, setSearchInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // API Integration
  const fetchPlaylists = async () => {
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
    }
  }

  const fetchPlaylistSongs = async (playlistId: string) => {
    setIsPlaylistLoading(true)
    try {
      if (playlistId === "liked-songs") {
        // For "Liked Songs", fetch from library/songs table
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/library`, {
          headers: {
            "ngrok-skip-browser-warning": "69420"
          }
        })
        const data = await response.json()
        if (data.status === "success") {
          setPlaylistSongs(data.data)
        }
      } else {
        // For regular playlists, fetch from playlist_songs junction table
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs`, {
          headers: {
            "ngrok-skip-browser-warning": "69420"
          }
        })
        const data = await response.json()
        if (data.status === "success") {
          setPlaylistSongs(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching playlist songs:", error)
    } finally {
      setIsPlaylistLoading(false)
    }
  }

  const saveToLibrary = async (song: any) => {
    try {
      // Use existing /save_song endpoint which saves to songs table
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save_song`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          video_id: song.video_id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          thumbnail_url: song.thumbnail_url || song.album_art_url
        }),
      })
      
      if (response.ok) {
        console.log('Song saved to library:', song.title)
      } else {
        console.error('Failed to save song to library')
      }
    } catch (error) {
      console.error('Error saving song to library:', error)
    }
  }

  const handleAddToPlaylist = async (song: any, playlistId: string, playlistName: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify(song),
      });

      const data = await response.json();

      if (data.status === 'info') {
        alert(`"${song.title}" is already in ${playlistName}`);
      } else if (data.status === 'success') {
        alert(`Added "${song.title}" to ${playlistName}`);
        await refreshLibrary();
      } else {
        alert('Failed to add song to playlist');
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      alert('Failed to add song to playlist');
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420"
        }
      })
      const data = await response.json()
      
      if (data.status === "success") {
        setSearchResults(data.data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToQueue = (song: any) => {
    setActiveQueue((prev) => {
      const newQueue = [...prev];
      
      // Same check: find if it exists later in the queue
      const existingIdx = newQueue.findIndex((s, i) => i > queueIndex && s.video_id === song.video_id);
      
      if (existingIdx !== -1) {
        newQueue.splice(existingIdx, 1);
      }
      
      // Push it to the very bottom
      newQueue.push(song);
      return newQueue;
    });
  };


  const playNext = (song: any) => {
    setActiveQueue((prev) => {
      const newQueue = [...prev];
      
      // Look for the song to see if it already exists AFTER the currently playing track
      const existingIdx = newQueue.findIndex((s, i) => i > queueIndex && s.video_id === song.video_id);
      
      // If it exists, delete it from its old spot so we can move it
      if (existingIdx !== -1) {
        newQueue.splice(existingIdx, 1);
      }
      
      // Insert it right after the currently playing song
      newQueue.splice(queueIndex + 1, 0, song);
      return newQueue;
    });
  };

  const handleSongClick = async (song: any) => {
    playNewStation(song)
  }

  const handlePlaylistClick = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setCurrentView('now-playing')
    setShowPlaylistView(true)  // Show playlist view instead of queue
    
    // Fetch songs for the selected playlist
    await fetchPlaylistSongs(playlist.id)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSearch(searchInput)
  }

  useEffect(() => {
    // Fetch playlists on initial mount
    fetchPlaylists()
  }, [])

  useEffect(() => {
    // Only log when queue or view actually changes meaningfully
    if (activeQueue.length > 0 && !showPlaylistView) {
      console.log('Queue view updated - songs in queue:', activeQueue.length - queueIndex - 1)
    }
  }, [showPlaylistView])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Search Bar - Only show in Search view */}
      {currentView === 'search' && (
        <div className="shrink-0 border-b border-border px-6 py-4 lg:px-8">
          <form onSubmit={handleSubmit} className="relative max-w-xl">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="h-10 w-full rounded-full border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Search songs, artists, albums"
            />
          </form>
        </div>
      )}

      {/* Content Area */}
      <div className={`flex flex-1 flex-col min-h-0 ${currentView === 'now-playing' ? 'overflow-hidden bg-gradient-to-b from-slate-900 to-[#0a0a0f]' : 'overflow-y-auto pb-32'}`}>
        
        {currentView === 'now-playing' ? (
          
          // Now Playing View - Split Screen (Using Flexbox instead of Grid)
          <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
            
            {/* Left Column - Locked Album Art */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 min-h-0 relative">
              {selectedPlaylist ? (
                // Show playlist info when a playlist is selected
                <div className="flex flex-col items-center w-full max-w-md">
                  <div className="relative w-3/4 md:w-full max-w-[280px] md:max-w-md aspect-square overflow-hidden rounded-xl shadow-2xl mb-4 md:mb-8 border border-slate-800/50">
                    <Image
                      src={selectedPlaylist.thumbnail_url || "/images/album-1.jpg"}
                      alt={`${selectedPlaylist.name} cover`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3 text-center line-clamp-1">
                    {selectedPlaylist.name}
                  </h1>
                  <p className="text-xl text-slate-400 text-center line-clamp-1">
                    {selectedPlaylist.description || 'No description'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPlaylist(null)
                      setShowPlaylistView(false)  // Reset to queue view
                      setCurrentView('library')
                    }}
                    className="mt-4 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Library
                  </button>
                </div>
              ) : currentSong ? (
                // Show current song when no playlist is selected
                <div className="flex flex-col items-center w-full max-w-md">
                  <div className="relative w-3/4 md:w-full max-w-[280px] md:max-w-md aspect-square overflow-hidden rounded-xl shadow-2xl mb-4 md:mb-8 border border-slate-800/50">
                    <Image
                      src={currentSong.thumbnail_url || currentSong.album_art_url || "/images/album-1.jpg"}
                      alt={`${currentSong.album || "album"} art`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3 text-center line-clamp-1">
                    {currentSong.title}
                  </h1>
                  <p className="text-xl text-slate-400 text-center line-clamp-1">
                    {currentSong.artist}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Right Column - Queue or Playlist Songs */}
            <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm border-l border-slate-800/50 min-h-0">
              <div className="p-6 border-b border-slate-800/50 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {showPlaylistView ? 'Playlist Songs' : 'Queue'}
                </h2>
                <p className="text-sm text-slate-400">
                  {showPlaylistView ? 'Songs in this playlist' : 'Up next from your station'}
                </p>
              </div>
              <ScrollArea className="flex-1 p-6 min-h-0">
                <div className="space-y-3">
                  {showPlaylistView ? (
                    // Playlist View - Show playlist songs
                    isPlaylistLoading ? (
                      <div className="text-center text-slate-400 py-8">
                        Loading songs...
                      </div>
                    ) : playlistSongs.length > 0 ? (
                      playlistSongs.map((song, index) => (
                        <div
                          key={song.video_id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group"
                          onClick={async () => {
                            // Set current song and preserve original playlist order
                            setCurrentSong(song)
                            setActiveQueue(playlistSongs)  // ✅ Keep original playlist order
                            setQueueIndex(index)  // ✅ Set index to clicked song's position
                            setIsPlaying(true)
                            
                            if (audioRef.current) {
                              audioRef.current.src = `${process.env.NEXT_PUBLIC_API_URL}/stream/${song.video_id}`;
                              await audioRef.current.play().catch(e => console.error("Playback error:", e));
                            }
                          }}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={song.thumbnail_url || "/images/album-1.jpg"}
                              alt={`${song.title} thumbnail`}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                              {song.title}
                            </h4>
                            <p className="text-sm text-slate-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {song.duration}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-slate-400 hover:text-white transition-colors"
                              aria-label="Like song"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Add like functionality here if needed
                              }}
                            >
                              <Heart className="size-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="text-slate-400 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  aria-label="More options"
                                >
                                  <MoreVertical className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-48 bg-slate-900 border-slate-700">
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Add to queue functionality
                                    if (showPlaylistView) {
                                      // If in playlist view, add to end of active queue (not modify playlist)
                                      const newQueue = [...playlistSongs]  // Start with full playlist
                                      // Check if song is already in the queue
                                      const existingIndex = newQueue.findIndex(s => s.video_id === song.video_id)
                                      if (existingIndex === -1) {
                                        // Only add if not already in queue
                                        newQueue.push(song)
                                        setActiveQueue(newQueue)
                                      }
                                    } else {
                                      // If in queue view, add to active queue
                                      const newQueue = [...activeQueue]
                                      const existingIndex = newQueue.findIndex((s, i) => i > queueIndex && s.video_id === song.video_id)
                                      if (existingIndex !== -1) {
                                        newQueue.splice(existingIndex, 1)
                                      }
                                      newQueue.push(song)
                                      setActiveQueue(newQueue)
                                    }
                                  }}
                                >
                                  <ListPlus className="mr-2 size-4" />
                                  Add to queue
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                    <ListMusic className="mr-2 size-4" />
                                    Add to playlist
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-48 bg-slate-900 border-slate-700">
                                      {playlists.filter(p => !p.is_auto_playlist).length > 0 ? (
                                        playlists.filter(p => !p.is_auto_playlist).map(playlist => (
                                          <DropdownMenuItem 
                                            key={playlist.id}
                                            className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddToPlaylist(song, playlist.id, playlist.name);
                                            }}
                                          >
                                            {playlist.name}
                                          </DropdownMenuItem>
                                        ))
                                      ) : (
                                        <DropdownMenuItem disabled className="text-slate-500">
                                          No playlists available
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Play next functionality
                                    
                                    if (showPlaylistView) {
                                      // If in playlist view, modify the active queue (not the playlist itself)
                                      const newQueue = [...playlistSongs]  // Start with full playlist
                                      // Find the clicked song's position in the playlist
                                      const clickedSongIndex = index
                                      // Find current song's position in the playlist
                                      const currentSongIndex = newQueue.findIndex(s => s.video_id === currentSong?.video_id)
                                      
                                      if (currentSongIndex !== -1) {
                                        // Remove the clicked song from its current position
                                        newQueue.splice(clickedSongIndex, 1)
                                        // Insert it right after the current song
                                        newQueue.splice(currentSongIndex + 1, 0, song)
                                        
                                        // Update active queue ONLY. The current song index remains the same!
                                        setActiveQueue(newQueue)
                                        // DO NOT change queueIndex here, as user is still listening to the current song.
                                      }
                                    } else {
                                      // If in queue view, modify the active queue
                                      const newQueue = [...activeQueue]
                                      const existingIndex = newQueue.findIndex((s, i) => i > queueIndex && s.video_id === song.video_id)
                                      if (existingIndex !== -1) {
                                        newQueue.splice(existingIndex, 1)
                                      }
                                      newQueue.splice(queueIndex + 1, 0, song)
                                      // Update active queue ONLY. The current song index remains the same!
                                      setActiveQueue(newQueue)
                                      // DO NOT change queueIndex here, as user is still listening to the current song.
                                    }
                                  }}
                                >
                                  <PlayIcon className="mr-2 size-4" />
                                  Play next
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Save to library functionality
                                    saveToLibrary(song)
                                  }}
                                >
                                  <Heart className="mr-2 size-4" />
                                  Save to Library
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Go to album functionality
                                  }}
                                >
                                  <Music2 className="mr-2 size-4" />
                                  Go to album
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Go to artist functionality
                                  }}
                                >
                                  <Search className="mr-2 size-4" />
                                  Go to artist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400 py-8">
                        No songs in this playlist
                      </div>
                    )
                  ) : (
                    // Queue View - Show radio queue with Play Next button
                    <>
                      {activeQueue.length > queueIndex + 1 ? (
                      activeQueue.slice(queueIndex + 1).map((song, index) => {
                        const actualIndex = queueIndex + 1 + index
                        return (
                        <div
                          key={`${song.video_id}-${actualIndex}-${song.title}`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group"
                          onClick={() => playFromQueue(queueIndex + 1 + index)}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={song.thumbnail_url || song.album_art_url || "/images/album-1.jpg"}
                              alt={`${song.album || "album"} art`}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                              {song.title}
                            </h4>
                            <p className="text-sm text-slate-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {song.duration}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-slate-400 hover:text-white transition-colors"
                              aria-label="Like song"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Add like functionality here if needed
                              }}
                            >
                              <Heart className="size-4" />
                            </button>
                            <button
                              className="text-slate-400 hover:text-white transition-colors"
                              aria-label="Play next"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                // Play next in queue
                                if (queueIndex + 1 + index < activeQueue.length) {
                                  playFromQueue(queueIndex + 1 + index)
                                }
                              }}
                            >
                              <PlayIcon className="size-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="text-slate-400 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  aria-label="More options"
                                >
                                  <MoreVertical className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-48 bg-slate-900 border-slate-700">
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Add to queue functionality
                                    const newQueue = [...activeQueue]
                                    const existingIndex = newQueue.findIndex((s, i) => i > queueIndex && s.video_id === song.video_id)
                                    if (existingIndex !== -1) {
                                      newQueue.splice(existingIndex, 1)
                                    }
                                    newQueue.push(song)
                                    setActiveQueue(newQueue)
                                  }}
                                >
                                  <ListPlus className="mr-2 size-4" />
                                  Add to queue
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                    <ListMusic className="mr-2 size-4" />
                                    Add to playlist
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-48 bg-slate-900 border-slate-700">
                                      {playlists.filter(p => !p.is_auto_playlist).length > 0 ? (
                                        playlists.filter(p => !p.is_auto_playlist).map(playlist => (
                                          <DropdownMenuItem 
                                            key={playlist.id}
                                            className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddToPlaylist(song, playlist.id, playlist.name);
                                            }}
                                          >
                                            {playlist.name}
                                          </DropdownMenuItem>
                                        ))
                                      ) : (
                                        <DropdownMenuItem disabled className="text-slate-500">
                                          No playlists available
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Save to library functionality
                                    saveToLibrary(song)
                                  }}
                                >
                                  <Heart className="mr-2 size-4" />
                                  Save to Library
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Go to album functionality
                                  }}
                                >
                                  <Music2 className="mr-2 size-4" />
                                  Go to album
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-slate-800 focus:bg-slate-800"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    // Go to artist functionality
                                  }}
                                >
                                  <Search className="mr-2 size-4" />
                                  Go to artist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })
                    ) : (
                      <div className="text-center text-slate-500 py-8">
                        No more songs in queue
                      </div>
                    )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          // Search/Library Views
          <>
            <div className="px-6 py-6 lg:px-8">
              {currentView === 'search' ? (
                // Search View
                <>
                  <h2 className="pb-1 text-xl font-bold text-foreground">
                    Search Results
                  </h2>
                  <p className="pb-5 text-sm text-muted-foreground">
                    {isLoading ? "Searching..." : searchResults.length > 0 ? `Showing ${searchResults.length} results${searchInput ? ` for "${searchInput}"` : ""}` : "Enter a search query to find songs"}
                  </p>

                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-border px-4 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid-cols-[2.5rem_1fr_1fr_auto_auto]">
                    <span className="hidden md:block">#</span>
                    <span>Title</span>
                    <span className="hidden sm:block">Album</span>
                    <span className="flex items-center justify-end">
                      <Clock className="size-3.5" />
                    </span>
                    <span className="sr-only">Actions</span>
                  </div>

                  {/* Search Results List */}
                  <ul role="list" className="flex flex-col">
                    {searchResults.map((song: any, index: number) => (
                      <li key={song.video_id || song.id || index}>
                        <div 
                          className="group grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 rounded-lg px-4 py-2.5 transition-colors hover:bg-player-hover md:grid-cols-[2.5rem_1fr_1fr_auto_auto] cursor-pointer"
                          onClick={() => playNewStation(song)}
                        >
                          {/* Track Number / Play */}
                          <div className="flex items-center justify-center md:hidden">
                            <Play className="size-4 text-primary" />
                          </div>
                          <div className="hidden items-center justify-center md:flex">
                            <span className="text-sm tabular-nums text-muted-foreground group-hover:hidden">
                              {index + 1}
                            </span>
                            <Play className="hidden size-4 text-primary group-hover:block" />
                          </div>

                          {/* Song Info */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                              <Image
                                src={song.thumbnail_url || song.album_art_url || "/images/album-1.jpg"}
                                alt={`${song.album || "album"} art`}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {song.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {song.artist}
                              </p>
                            </div>
                          </div>

                          {/* Album */}
                          <span className="hidden truncate text-sm text-muted-foreground sm:block">
                            {song.album || "Single"}
                          </span>

                          {/* Duration */}
                          <span className="text-right text-sm tabular-nums text-muted-foreground">
                            {song.duration}
                          </span>

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex size-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                                aria-label="More options"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 bg-slate-900 border-slate-700">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); playNext(song); }} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                <PlayIcon className="mr-2 size-4" />
                                Play next
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addToQueue(song); }} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                <ListPlus className="mr-2 size-4" />
                                Add to queue
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                  <ListMusic className="mr-2 size-4" />
                                  Add to playlist
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="w-48 bg-slate-900 border-slate-700">
                                    {playlists.filter(p => !p.is_auto_playlist).length > 0 ? (
                                      playlists.filter(p => !p.is_auto_playlist).map(playlist => (
                                        <DropdownMenuItem 
                                          key={playlist.id}
                                          className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToPlaylist(song, playlist.id, playlist.name);
                                          }}
                                        >
                                          {playlist.name}
                                        </DropdownMenuItem>
                                      ))
                                    ) : (
                                      <DropdownMenuItem disabled className="text-slate-500">
                                        No playlists available
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); saveToLibrary(song); }} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                <Heart className="mr-2 size-4" />
                                Save to Library
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Go to album functionality */ }} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                <Music2 className="mr-2 size-4" />
                                Go to album
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Go to artist functionality */ }} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                <Search className="mr-2 size-4" />
                                Go to artist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                // Library View - Playlist Grid
                <>
                  <h2 className="pb-1 text-xl font-bold text-foreground">
                    Your Library
                  </h2>
                  <p className="pb-5 text-sm text-muted-foreground">
                    {playlists.length > 0 ? `${playlists.length} playlists` : "No playlists yet"}
                  </p>

                  {/* Playlist Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map((playlist: Playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => handlePlaylistClick(playlist)}
                        className={`cursor-pointer rounded-lg overflow-hidden transition-all hover:scale-105 ${
                          playlist.is_auto_playlist 
                            ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500' 
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={playlist.thumbnail_url || "/images/album-1.jpg"}
                            alt={`${playlist.name} thumbnail`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                          {playlist.is_auto_playlist && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className={`font-medium truncate ${
                            playlist.is_auto_playlist ? 'text-white' : 'text-foreground'
                          }`}>
                            {playlist.name}
                          </h3>
                          <p className={`text-sm truncate ${
                            playlist.is_auto_playlist ? 'text-white/80' : 'text-muted-foreground'
                          }`}>
                            {playlist.description}
                          </p>
                          <p className={`text-xs mt-1 ${
                            playlist.is_auto_playlist ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}


      </div>
          </>
        )}
      </div>
      
      </main>
  )
}
