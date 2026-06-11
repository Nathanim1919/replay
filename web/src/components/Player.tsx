"use client"

import {
  parseReplay,
  computeWaveform,
  buildSearchIndex,
  ReplaySession,
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
import Search from "./Search"

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

  const rafRef = useRef<number | null>(null)
  const lastWallTime = useRef<number>(0)
  const lastReplayTime = useRef<number>(0)
  const eventIndex = useRef(0)
  const speedRef = useRef(speed)

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

  // Auto play (preview/demo use cases)
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

  const format = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // -------------------------
  // PREVIEW MODE (dashboard)
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
  // FULL MODE (session page)
  // -------------------------
  return (
    <div className="w-full h-full text-white flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between bg-[#161616] border border-[#222] rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-blue-500 font-bold">Replay</span>
          <span className="text-sm text-gray-400">
            {session.header.shell}
          </span>
        </div>

        <div className="text-sm text-gray-400">
          {format(duration)}
        </div>
      </div>

      {/* Terminal */}
      <div className="w-full bg-black rounded-lg overflow-hidden">
        <Terminal
          ref={terminalRef}
          width={session.header.width}
          height={session.header.height}
        />
      </div>

      {/* Waveform */}
      <Waveform
        bars={waveform}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? pause : play}
          className={`px-4 py-1 rounded text-sm font-bold ${
            isPlaying ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        {[1, 2, 4, 8].map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`px-3 py-1 text-sm rounded border ${
              speed === s
                ? "bg-blue-500 border-blue-400 text-white"
                : "bg-transparent border-gray-600 text-gray-400"
            }`}
          >
            {s}x
          </button>
        ))}

        <div className="ml-auto text-xs text-gray-400 font-mono">
          {format(currentTime)} / {format(duration)}
        </div>
      </div>

      {/* Search */}
      <Search index={searchIndex} onSeek={seek} />
    </div>
  )
}

export default Player