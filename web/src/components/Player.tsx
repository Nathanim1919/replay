"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Terminal from "./Terminal"
import Waveform from "./Waveform"
import { Play, Pause, Maximize, Minimize, RotateCcw } from "lucide-react"
import { usePlayer } from "@/hooks/usePlayer"

interface PlayerProps {
  mode?: "preview" | "full"
}

export const Player = ({ mode = "full" }: PlayerProps) => {
  // Grab everything from our custom context hook
  const {
    waveform,
    duration,
    play,
    isPlaying,
    pause,
    seek,
    changeSpeed,
    currentTime,
    terminalRef,
    speed,
    currentTelemetry,
  } = usePlayer()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.()
  }, [])

  // FIX EFFECT: Keep the latest time accessible to the window event listener without re-binding it
  const latestTimeRef = useRef(currentTime)
  useEffect(() => {
    latestTimeRef.current = currentTime
  }, [currentTime])

  // Handles smooth terminal scaling and redraw on window layout switches
  useEffect(() => {
    const onFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFull)

      requestAnimationFrame(() => {
        // Safely wipe and re-render historical terminal chunks at the current timestamp
        terminalRef.current?.reset?.()
        seek(latestTimeRef.current)
      })
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [seek, terminalRef])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // -------------------------
  // PREVIEW MODE
  // -------------------------
  if (mode === "preview") {
    return (
      <div className="w-full h-full bg-[#0d0d0d] overflow-hidden">
        <Terminal ref={terminalRef} width={80} height={24} preview />
      </div>
    )
  }

  // -------------------------
  // FULL PLAYBACK MODE
  // -------------------------
  return (
    <div
      ref={containerRef}
      className={`w-full text-white flex flex-col bg-black overflow-hidden ${
        isFullscreen ? "h-screen fixed inset-0 z-50" : "h-125 border border-zinc-800 rounded-lg"
      }`}
    >
      <div className="flex-1 min-h-0 w-full relative group overflow-hidden bg-black">
        <Terminal ref={terminalRef} width={80} height={24} preview={false} />

        {/* Live OS Telemetry Context Overlay */}
        {currentTelemetry && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-300 shadow-md transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">DIR:</span>
            <span className="text-white font-medium max-w-40 truncate">{currentTelemetry.cwd}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">PID:</span>
            <span className="text-zinc-200">{currentTelemetry.pid}</span>
            {Boolean(currentTelemetry.mem_mb) && (currentTelemetry.mem_mb ?? 0) > 0 && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">RAM:</span>
                <span className="text-orange-400 font-semibold">{currentTelemetry.mem_mb?.toFixed(1)}MB</span>
              </>
            )}
          </div>
        )}

        {/* Playback Control Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/95 via-black/70 to-transparent p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          
          {/* Timeline Waveform */}
          <Waveform
            bars={waveform}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => seek(0)}
              className="cursor-pointer text-zinc-400 hover:text-white transition-colors"
              title="Restart"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={isPlaying ? pause : play}
              className="cursor-pointer p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-md transition-colors"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Speed Selectors */}
            <div className="flex items-center gap-1 bg-zinc-900/60 p-0.5 border border-zinc-800/80 rounded-md ml-2">
              {[1, 2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                    speed === s
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Timestamp & Screen Toggles */}
            <div className="flex items-center gap-3 ml-auto text-xs font-mono text-zinc-400">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                className="cursor-pointer hover:text-white transition-colors"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Player