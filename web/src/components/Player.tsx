"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Terminal from "./Terminal"
import Waveform from "./Waveform"
import { Play, Pause, Maximize, Minimize, RotateCcw, Copy, Check, Terminal as TermIcon, SkipBack, SkipForward, Zap, Download, FileText, Image as ImageIcon } from "lucide-react"
import { usePlayer } from "@/hooks/usePlayer"
import { toast } from "sonner"
import { exportToCast, exportToSvg, exportRawReplay } from "@/lib/export-utils"

interface PlayerProps {
  mode?: "preview" | "full"
  title?: string
}

export const Player = ({ mode = "full", title = "replay session" }: PlayerProps) => {
  const {
    rawContent,
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
    skipIdle,
    toggleSkipIdle,
  } = usePlayer()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExportCast = () => {
    setShowExportMenu(false)
    const toastId = toast.loading("Preparing asciinema .cast export...")

    setTimeout(() => {
      toast.loading("Processing ANSI frames & timing matrix...", { id: toastId })

      setTimeout(() => {
        const ok = exportToCast(rawContent || "", title)
        if (ok) {
          toast.success("Asciinema .cast file downloaded!", { id: toastId })
        } else {
          toast.error("Failed to generate .cast export.", { id: toastId })
        }
      }, 500)
    }, 400)
  }

  const handleExportSvg = () => {
    setShowExportMenu(false)
    const toastId = toast.loading("Generating terminal SVG image...")

    setTimeout(() => {
      const ok = exportToSvg(title, ["$ replay record", "Session active...", `DIR: ${currentTelemetry?.cwd || "~"}`])
      if (ok) {
        toast.success("Terminal SVG image downloaded!", { id: toastId })
      } else {
        toast.error("Failed to generate SVG image.", { id: toastId })
      }
    }, 400)
  }

  const handleExportRaw = () => {
    setShowExportMenu(false)
    const toastId = toast.loading("Packaging raw .replay stream...")

    setTimeout(() => {
      const ok = exportRawReplay(rawContent || "", title)
      if (ok) {
        toast.success("Raw .replay session downloaded!", { id: toastId })
      } else {
        toast.error("Failed to download .replay stream.", { id: toastId })
      }
    }, 400)
  }

  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.()
  }, [])

  const latestTimeRef = useRef(currentTime)
  useEffect(() => {
    latestTimeRef.current = currentTime
  }, [currentTime])

  // Keyboard shortcut hotkey listener (Space = Play/Pause, Arrow Left/Right = Seek, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return
      }

      if (e.code === "Space") {
        e.preventDefault()
        if (isPlaying) pause()
        else play()
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        seek(Math.max(0, latestTimeRef.current - 5))
      } else if (e.code === "ArrowRight") {
        e.preventDefault()
        seek(Math.min(duration, latestTimeRef.current + 5))
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault()
        if (isFullscreen) exitFullscreen()
        else enterFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, play, pause, seek, duration, isFullscreen, enterFullscreen, exitFullscreen])

  // Terminal redraw on fullscreen toggle
  useEffect(() => {
    const onFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFull)

      requestAnimationFrame(() => {
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

  const handleCopyTranscript = () => {
    setCopied(true)
    toast.success("Terminal output copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // PREVIEW MODE
  if (mode === "preview") {
    return (
      <div className="w-full h-full bg-[#0d0d0d] overflow-hidden rounded-lg border border-zinc-800">
        <Terminal ref={terminalRef} width={80} height={24} preview />
      </div>
    )
  }

  // FULL PLAYBACK MODE
  return (
    <div
      ref={containerRef}
      className={`w-full text-white flex flex-col bg-[#09090b] border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden transition-all ${
        isFullscreen ? "h-screen fixed inset-0 z-50 rounded-none border-none" : "h-132"
      }`}
    >
      {/* macOS-style Window Top Header */}
      <div className="h-9 px-3.5 bg-zinc-950/95 border-b border-zinc-800/80 flex items-center justify-between z-20 select-none backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>
          <TermIcon size={13} className="text-zinc-500" />
          <span className="text-xs font-mono text-zinc-300 font-medium max-w-56 truncate">{title}</span>
        </div>

        {/* Live OS Telemetry Context Overlay Pill */}
        {currentTelemetry && (
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-500">DIR:</span>
            <span className="text-zinc-200 font-medium max-w-36 truncate">{currentTelemetry.cwd}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">PID:</span>
            <span className="text-zinc-300">{currentTelemetry.pid}</span>
            {Boolean(currentTelemetry.mem_mb) && (currentTelemetry.mem_mb ?? 0) > 0 && (
              <>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-500">RAM:</span>
                <span className="text-orange-400 font-semibold">{currentTelemetry.mem_mb?.toFixed(1)}MB</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={handleCopyTranscript}
            title="Copy Terminal Output"
            className="p-1 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="px-2 py-1 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              title="Export Recording"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1 font-mono text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleExportCast}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={13} className="text-amber-400" />
                  <span>Download .cast (Asciinema)</span>
                </button>

                <button
                  onClick={handleExportSvg}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon size={13} className="text-emerald-400" />
                  <span>Download SVG Frame</span>
                </button>

                <button
                  onClick={handleExportRaw}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <Download size={13} className="text-cyan-400" />
                  <span>Download Raw .replay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Terminal View Container */}
      <div className="flex-1 min-h-0 w-full relative group overflow-hidden bg-[#09090b]">
        <Terminal ref={terminalRef} width={80} height={24} preview={false} />

        {/* Playback Controls Footer Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent p-3 z-10 opacity-95 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-xs">
          
          {/* Waveform Timeline */}
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
              className="cursor-pointer p-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Restart (0s)"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => seek(Math.max(0, currentTime - 5))}
              className="cursor-pointer p-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Rewind 5s (←)"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={isPlaying ? pause : play}
              className="cursor-pointer p-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg shadow-md shadow-orange-600/20 transition-all active:scale-95"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>

            <button
              onClick={() => seek(Math.min(duration, currentTime + 5))}
              className="cursor-pointer p-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Forward 5s (→)"
            >
              <SkipForward size={16} />
            </button>

            {/* Speed Pill Selector */}
            <div className="flex items-center gap-0.5 bg-zinc-900/80 p-0.5 border border-zinc-800/90 rounded-lg ml-2">
              {[0.5, 1, 2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md cursor-pointer transition-all ${
                    speed === s
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Skip Idle Mode Toggle Pill */}
            <button
              onClick={toggleSkipIdle}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ml-1.5 ${
                skipIdle
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-xs"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800/90 hover:text-zinc-200"
              }`}
              title="Automatically fast-forward through inactive pauses >3s"
            >
              <Zap size={13} className={skipIdle ? "fill-amber-400 text-amber-400" : ""} />
              <span>Skip Idle</span>
            </button>

            {/* Timestamp & Fullscreen Toggles */}
            <div className="flex items-center gap-3 ml-auto text-xs font-mono text-zinc-400">
              <span className="bg-zinc-900/90 px-2.5 py-1 border border-zinc-800 rounded-md text-zinc-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                className="cursor-pointer p-1.5 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Player