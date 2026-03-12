"use client"

import { Sidebar } from "@/components/player/sidebar"
import { MainContent } from "@/components/player/main-content"
import { Playbar } from "@/components/player/playbar"
import { MobileNav } from "@/components/player/mobile-nav"
import { useState, useRef, useEffect } from "react"

export default function Page() {
  const [currentSong, setCurrentSong] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isLiked, setIsLiked] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'OFF' | 'ALL' | 'ONE'>('OFF')
  const [currentView, setCurrentView] = useState<'search' | 'library' | 'now-playing'>('search')
  const [librarySongs, setLibrarySongs] = useState<any[]>([])
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [activeQueue, setActiveQueue] = useState<any[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  
  // New state for playlist management
  const [playlists, setPlaylists] = useState<any[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null)
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([])
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)
  const [showPlaylistView, setShowPlaylistView] = useState(false)  // New state to separate playlist/queue views
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  const handleSeek = (newTime: number[]) => {
    const time = newTime[0]
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const refreshLibrary = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists`)
      const data = await response.json()
      if (data.status === "success") {
        setPlaylists(data.data)
      }
    } catch (error) {
      console.error("Error refreshing library:", error)
    }
  }

  const handleLikeSong = async () => {
    if (!currentSong) return
    
    try {
      let response
      
      if (isLiked) {
        // Unlike: Send DELETE request
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/remove_song/${currentSong.video_id}`, {
          method: 'DELETE',
        })
      } else {
        // Like: Send POST request
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save_song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: currentSong.video_id,
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            duration: currentSong.duration,
            thumbnail_url: currentSong.thumbnail_url,
          }),
        })
      }
      
      const data = await response.json()
      if (data.status === 'success') {
        setIsLiked(!isLiked)
        // Refresh library to update playlist song counts instantly
        if (!isLiked) {
          refreshLibrary()
        }
      }
    } catch (error) {
      console.error('Error toggling song:', error)
    }
  }

  const playNewStation = async (song: any) => {
    setCurrentSong(song)
    setQueueIndex(0)
    setIsPlaying(true)
    
    // Clear playlist state when playing from search
    setSelectedPlaylist(null)
    setShowPlaylistView(false)  // Hide playlist view, show queue
    
    // Fetch radio queue when playing any song
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/radio/${song.video_id}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setActiveQueue(data.data)
      }
    } catch (error) {
      console.error('Error fetching radio queue:', error)
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/${song.video_id}`)
      const data = await response.json()
      
      if (data.status === "success" && audioRef.current) {
        audioRef.current.src = data.stream_url
        // Audio will play automatically, onPlay event will set isPlaying
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Stream error:", error)
    }
  }

  const playFromQueue = async (index: number) => {
    if (activeQueue.length === 0 || index < 0 || index >= activeQueue.length) return
    
    const song = activeQueue[index]
    setQueueIndex(index)
    setCurrentSong(song)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/${song.video_id}`)
      const data = await response.json()
      
      if (data.status === "success" && audioRef.current) {
        audioRef.current.src = data.stream_url
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Stream error:", error)
    }
  }

  const handleNext = () => {
    if (activeQueue.length === 0) return
    
    // If repeat mode is ONE, replay current song
    if (repeatMode === 'ONE') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
      return
    }
    
    let nextIndex: number
    
    if (isShuffle) {
      // Pick a random track from activeQueue that's not the current one
      do {
        nextIndex = Math.floor(Math.random() * activeQueue.length)
      } while (nextIndex === queueIndex && activeQueue.length > 1)
    } else {
      // Go to next track in activeQueue
      nextIndex = queueIndex === -1 ? 0 : (queueIndex + 1) % activeQueue.length
      
      // Handle end of queue logic
      if (queueIndex === activeQueue.length - 1 && repeatMode === 'OFF') {
        // Stop playback at end of queue
        if (audioRef.current) {
          audioRef.current.pause()
        }
        return
      }
    }
    
    playFromQueue(nextIndex)
  }

  const handlePrevious = () => {
    if (activeQueue.length === 0) return
    
    // If current time is greater than 3 seconds, restart current song
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
      return
    }
    
    let prevIndex: number
    
    if (isShuffle) {
      // Pick a random track from activeQueue that's not the current one
      do {
        prevIndex = Math.floor(Math.random() * activeQueue.length)
      } while (prevIndex === queueIndex && activeQueue.length > 1)
    } else {
      // Go to previous track in activeQueue with looping
      prevIndex = queueIndex === -1 ? activeQueue.length - 1 : (queueIndex - 1 + activeQueue.length) % activeQueue.length
    }
    
    playFromQueue(prevIndex)
  }

  const toggleRepeat = () => {
    setRepeatMode(current => {
      if (current === 'OFF') return 'ALL'
      if (current === 'ALL') return 'ONE'
      return 'OFF'
    })
  }

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle)
  }

  const fetchLibrary = async () => {
    setIsLibraryLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/library`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setLibrarySongs(data.data)
      }
    } catch (error) {
      console.error('Error fetching library:', error)
    } finally {
      setIsLibraryLoading(false)
    }
  }

  // Fetch library when currentView changes to 'library'
  useEffect(() => {
    if (currentView === 'library') {
      fetchLibrary()
    }
  }, [currentView])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  // Check if currentSong is saved when it changes
  useEffect(() => {
    const checkIfSongIsSaved = async () => {
      if (!currentSong) {
        setIsLiked(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/check_song/${currentSong.video_id}`)
        const data = await response.json()
        
        console.log('Checking DB for:', currentSong.video_id, 'Result:', data.is_saved)
        
        if (data.status === 'success') {
          setIsLiked(data.is_saved)
        }
      } catch (error) {
        console.error('Error checking song status:', error)
        setIsLiked(false)
      }
    }

    checkIfSongIsSaved()
  }, [currentSong?.video_id])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar 
            currentView={currentView}
            setCurrentView={setCurrentView}
            refreshLibrary={refreshLibrary}
          />
        </div>

        {/* Central content area */}
        <MainContent 
          currentSong={currentSong}
          setCurrentSong={setCurrentSong}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          togglePlayPause={togglePlayPause}
          audioRef={audioRef}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          playNewStation={playNewStation}
          playFromQueue={playFromQueue}
          currentView={currentView}
          setCurrentView={setCurrentView}
          librarySongs={librarySongs}
          isLibraryLoading={isLibraryLoading}
          activeQueue={activeQueue}
          setActiveQueue={setActiveQueue}
          queueIndex={queueIndex}
          setQueueIndex={setQueueIndex}
          playlists={playlists}
          setPlaylists={setPlaylists}
          selectedPlaylist={selectedPlaylist}
          setSelectedPlaylist={setSelectedPlaylist}
          playlistSongs={playlistSongs}
          setPlaylistSongs={setPlaylistSongs}
          isPlaylistLoading={isPlaylistLoading}
          setIsPlaylistLoading={setIsPlaylistLoading}
          showPlaylistView={showPlaylistView}
          setShowPlaylistView={setShowPlaylistView}
          refreshLibrary={refreshLibrary}
        />
      </div>

      {/* Fixed bottom playbar */}
      <Playbar 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        isLiked={isLiked}
        onLikeSong={handleLikeSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
        activeQueue={activeQueue}
        queueIndex={queueIndex}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={toggleShuffle}
        currentView={currentView}
        setCurrentView={setCurrentView}
        showPlaylistView={showPlaylistView}
        onTogglePlaylistView={() => setShowPlaylistView(!showPlaylistView)}
      />

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Mobile bottom nav — visible only on small screens */}
      <MobileNav />
    </div>
  )
}
