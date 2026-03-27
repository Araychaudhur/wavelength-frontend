"use client"

import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Volume2,
  Heart,
  Maximize2,
  Minimize2,
  List,
  Music2
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00"
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

interface PlaybarProps {
  currentSong: any
  isPlaying: boolean
  onTogglePlayPause: () => void
  currentTime: number
  duration: number
  volume: number
  onVolumeChange: (volume: number[]) => void
  onSeek: (time: number[]) => void
  isLiked: boolean
  onLikeSong: () => Promise<void>
  onNext: () => void
  onPrevious: () => void
  isShuffle: boolean
  repeatMode: 'OFF' | 'ALL' | 'ONE'
  onToggleRepeat: () => void
  onToggleShuffle: () => void
  currentView: 'search' | 'library' | 'now-playing'
  setCurrentView: (view: 'search' | 'library' | 'now-playing') => void
  activeQueue: any[]
  queueIndex: number
  showPlaylistView: boolean
  onTogglePlaylistView?: () => void
  onExpandPlayer?: () => void
}

export function Playbar({ currentSong, isPlaying, onTogglePlayPause, currentTime, duration, volume, onVolumeChange, onSeek, isLiked, onLikeSong, onNext, onPrevious, isShuffle, repeatMode, onToggleRepeat, onToggleShuffle, currentView, setCurrentView, activeQueue, queueIndex, showPlaylistView, onTogglePlaylistView, onExpandPlayer }: PlaybarProps) {
  return (
    <footer
      className="flex h-20 shrink-0 items-center border-t border-border bg-player-surface px-4 lg:h-24 lg:px-6"
      role="contentinfo"
      aria-label="Music player controls"
    >
      {/* Now Playing - Left */}
      <div className="flex flex-1 min-w-0 items-center gap-3 md:w-[30%] cursor-pointer md:cursor-default"
           onClick={() => { if (window.innerWidth < 768 && onExpandPlayer) onExpandPlayer(); else if (window.innerWidth < 768) setCurrentView('now-playing'); }}>
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md shadow-lg lg:size-14">
          <Image
            src={currentSong?.thumbnail_url || "/images/now-playing.jpg"}
            alt={`${currentSong?.album || "Now playing"} album art`}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {currentSong?.title || "No song playing"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentSong?.artist || ""}
          </p>
        </div>
        <button
          className={`ml-2 hidden shrink-0 transition-colors sm:block ${
            isLiked 
              ? "text-teal-400 fill-teal-400" 
              : "text-muted-foreground hover:text-primary"
          }`}
          aria-label="Like this song"
          onClick={onLikeSong}
        >
          <Heart className={`size-4 ${isLiked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Transport Controls - Center */}
      <div className="flex flex-1 flex-col items-center gap-1.5 px-4 lg:gap-2">
        <div className="flex items-center gap-3 lg:gap-5">
          <button
            className={`transition-colors ${
              isShuffle 
                ? "text-teal-400" 
                : "text-muted-foreground hover:text-foreground"
            } ${currentView === 'now-playing' ? 'block' : 'hidden md:block'}`}
            aria-label="Toggle shuffle"
            onClick={onToggleShuffle}
          >
            <Shuffle className="size-4" />
          </button>
          <button
            className={`text-muted-foreground transition-colors hover:text-foreground ${currentView === 'now-playing' ? 'block' : 'hidden md:block'}`}
            aria-label="Previous track"
            onClick={onPrevious}
          >
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 lg:size-10"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={onTogglePlayPause}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current pl-0.5" />
            )}
          </button>
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Next track"
            onClick={onNext}
          >
            <SkipForward className="size-5 fill-current" />
          </button>
          <button
            className={`transition-colors relative ${
              repeatMode === 'OFF' 
                ? "text-muted-foreground hover:text-foreground" 
                : "text-teal-400"
            } ${currentView === 'now-playing' ? 'block' : 'hidden md:block'}`}
            aria-label={`Repeat mode: ${repeatMode}`}
            onClick={onToggleRepeat}
          >
            {repeatMode === 'ONE' ? (
              <Repeat1 className="size-4" />
            ) : (
              <Repeat className="size-4" />
            )}
            {repeatMode === 'ONE' && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold text-teal-400">
                1
              </span>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className={`${currentView === 'now-playing' ? 'flex' : 'hidden md:flex'} w-full max-w-xl items-center gap-2`}>
          <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            className="flex-1 cursor-pointer"
            aria-label="Song progress"
            onValueChange={onSeek}
          />
          <span className="w-10 text-[11px] tabular-nums text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Controls - Right */}
      <div className="hidden md:flex w-1/4 min-w-0 items-center justify-end gap-3 lg:w-[30%]">
        {currentView === 'now-playing' && onTogglePlaylistView && (
          <button
            className="text-slate-400 hover:text-white transition-colors mr-2"
            aria-label={showPlaylistView ? "Show queue" : "Show playlist"}
            onClick={onTogglePlaylistView}
          >
            {showPlaylistView ? (
              <Music2 className="size-4" />
            ) : (
              <List className="size-4" />
            )}
          </button>
        )}
        <button
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle now playing view"
          onClick={() => {
            if (currentView === 'now-playing') {
              // If in now-playing, toggle between playlist view and queue view
              // This will be handled by the parent component
              return
            }
            // If not in now-playing, go to now-playing view
            setCurrentView('now-playing')
          }}
        >
          {currentView === 'now-playing' ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
        <button
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Volume"
        >
          <Volume2 className="size-4" />
        </button>
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          className="w-28 cursor-pointer"
          aria-label="Volume"
          onValueChange={onVolumeChange}
        />
      </div>
    </footer>
  )
}
