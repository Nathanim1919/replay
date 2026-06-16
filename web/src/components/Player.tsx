"use client"

import {
  parseReplay,
  computeWaveform,
  buildSearchIndex,
} from "@/lib/replay-parser"

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react"

import Terminal, { TerminalHandle } from "./Terminal"
import Waveform from "./Waveform"

import { Search as SearchIcon, Play, Pause, Maximize, Minimize, RotateCcw } from "lucide-react"

interface PlayerProps {
  content: string
  mode?: "preview" | "full"
  autoPlay?: boolean
}

export const Player = ({
  content,
  mode = "full",
  autoPlay = false,
}: PlayerProps) => {
  const session = useMemo(() => parseReplay(content), [content])

  const terminalRef = useRef<TerminalHandle>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const rafRef = useRef<number | null>(null)
  const lastWallTime = useRef<number>(0)
  const lastReplayTime = useRef<number>(0)
  const eventIndex = useRef(0)
  const speedRef = useRef(speed)

  // Use a ref for currentTime to avoid stale closure issues inside the event listener
  const currentTimeRef = useRef(currentTime)
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const duration = session.events.at(-1)?.time ?? 0

  const waveform = useMemo(
    () => computeWaveform(session.events, 150),
    [session]
  )

  const searchIndex = useMemo(
    () => buildSearchIndex(session.events),
    [session]
  )

  const clear = useCallback(() => {
    terminalRef.current?.reset()
    eventIndex.current = 0
  }, [])

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (el.requestFullscreen) {
      el.requestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()

    const delta = (now - lastWallTime.current) / 1000
    const replayTime = lastReplayTime.current + delta * speedRef.current

    const events = session.events

    while (
      eventIndex.current < events.length &&
      events[eventIndex.current].time <= replayTime
    ) {
      const e = events[eventIndex.current]
      if (e.type === "o" && e.data) {
        terminalRef.current?.write(e.data)
      }
      eventIndex.current++
    }

    setCurrentTime(replayTime)

    if (eventIndex.current >= events.length) {
      setIsPlaying(false)
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [session])

  const play = useCallback(() => {
    lastWallTime.current = Date.now()
    lastReplayTime.current = currentTime

    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [currentTime, tick])

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
  }, [])

  const seek = useCallback(
    (time: number) => {
      const events = session.events

      clear()

      for (let i = 0; i < events.length; i++) {
        if (events[i].time > time) break

        if (events[i].type === "o" && events[i].data) {
          terminalRef.current?.write(events[i].data)
        }

        eventIndex.current = i + 1
      }

      setCurrentTime(time)

      if (isPlaying) {
        lastWallTime.current = Date.now()
        lastReplayTime.current = time
        rafRef.current = requestAnimationFrame(tick)
      } else {
        lastReplayTime.current = time
      }
    },
    [session, isPlaying, tick, clear]
  )

  const changeSpeed = useCallback(
    (s: number) => {
      setSpeed(s)

      if (isPlaying) {
        lastWallTime.current = Date.now()
        lastReplayTime.current = currentTime
      }
    },
    [isPlaying, currentTime]
  )

  useEffect(() => {
    if (autoPlay || mode === "preview") {
      clear()
      lastWallTime.current = Date.now()
      lastReplayTime.current = 0
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [autoPlay, mode, tick, clear])


  // SMART FIXED EFFECT: Consolidates full screen handling and ensures buffer rebuild
  useEffect(() => {
    const onChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFull)

      // Use requestAnimationFrame so the DOM finishes switching scales/dimensions
      requestAnimationFrame(() => {
        // 1. Completely reset terminal to accommodate layout size updates safely
        terminalRef.current?.reset?.()
        
        // 2. Re-seek to the exact same position to redraw historical chunks
        seek(currentTimeRef.current)
      })
    }

    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [seek])

  const format = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // -------------------------
  // PREVIEW MODE
  // -------------------------
  if (mode === "preview") {
    return (
      <div className="w-full h-full bg-[#0d0d0d] overflow-hidden">
        <Terminal
          ref={terminalRef}
          width={session.header.width}
          height={session.header.height}
          preview
        />
      </div>
    )
  }

  // -------------------------
  // FULL MODE
  // -------------------------
  return (
    <div
      ref={containerRef}
      className={`w-full text-white flex flex-col bg-black overflow-hidden ${
        isFullscreen ? "h-screen fixed inset-0 z-50" : "h-125 border border-[#222]"
      }`}
    >
      <div className="flex-1 min-h-0 w-full relative group overflow-hidden bg-black shadow-3xl">
        <Terminal
          ref={terminalRef}
          width={session.header.width}
          height={session.header.height}
          preview={false}
        />

        {/* YouTube-style overlay */}
        <div className="
          absolute bottom-0 left-0 right-0
          bg-linear-to-t from-black/90 to-transparent
          p-2 z-10
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        ">
          {/* Waveform */}
          <Waveform
            bars={waveform}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => seek(0)} 
              className="cursor-pointer opacity-50 hover:opacity-100"
            >
              <RotateCcw size={18}/>
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="cursor-pointer p-1 hover:bg-gray-800 rounded-md"
            >
              {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
            </button>

            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`px-2 cursor-pointer hover:bg-[#ff3209] py-0.5 text-sm rounded ${
                  speed === s
                    ? "bg-[#ff3209]  text-white"
                    : "bg-transparent text-gray-400"
                }`}
              >
                {s}x
              </button>
            ))}

            <div className="flex items-center gap-2 ml-auto text-sm text-gray-400">
              <span>
                {format(currentTime)} / {format(duration)}
              </span>
              <button
                className="cursor-pointer"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              >
                {isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player