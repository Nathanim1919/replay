"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from "react"
import { parseReplay, computeWaveform, buildSearchIndex, SearchIndex, TelemetryData, ReplayEvent } from "@/lib/replay-parser"

interface PlayerContextType {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  skipIdle: boolean
  searchIndex: SearchIndex | null
  waveform: number[]
  terminalRef: React.RefObject<any>
  currentTelemetry: TelemetryData | null
  play: () => void
  pause: () => void
  seek: (time: number) => void
  changeSpeed: (speed: number) => void
  toggleSkipIdle: () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ content, children }: { content: string; children: React.ReactNode }) {
  const session = useMemo(() => parseReplay(content), [content])
  const terminalRef = useRef<any>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [skipIdle, setSkipIdle] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null)

  const rafRef = useRef<number | null>(null)
  const lastWallTime = useRef<number>(0)
  const lastReplayTime = useRef<number>(0)
  const eventIndex = useRef(0)
  const speedRef = useRef(speed)
  const skipIdleRef = useRef(skipIdle)

  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { skipIdleRef.current = skipIdle }, [skipIdle])

  const toggleSkipIdle = useCallback(() => {
    setSkipIdle((prev) => !prev)
  }, [])

  const duration = session.events.at(-1)?.time ?? 0
  const waveform = useMemo(() => computeWaveform(session.events, 150), [session])
  const searchIndex = useMemo(() => buildSearchIndex(session.events), [session])

  const clear = useCallback(() => {
    terminalRef.current?.reset()
    eventIndex.current = 0
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const delta = (now - lastWallTime.current) / 1000
    let replayTime = lastReplayTime.current + delta * speedRef.current
    const events = session.events

    while (eventIndex.current < events.length && events[eventIndex.current].time <= replayTime) {
      const e = events[eventIndex.current]
      if (e.type === "o" && e.data) {
        terminalRef.current?.write(e.data)
      } else if (e.type === "p" && e.telemetry) {
        setCurrentTelemetry(e.telemetry)
      }
      eventIndex.current++
    }

    // Skip-idle playback logic: If next event is > 3s ahead, advance replayTime automatically
    if (skipIdleRef.current && eventIndex.current < events.length) {
      const nextEventTime = events[eventIndex.current].time
      if (nextEventTime - replayTime > 3.0) {
        replayTime = Math.max(replayTime, nextEventTime - 0.2)
        lastReplayTime.current = replayTime
        lastWallTime.current = now
      }
    }

    setCurrentTime(replayTime)

    if (eventIndex.current >= events.length && replayTime >= duration) {
      setIsPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [session, duration])

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

  const seek = useCallback((targetTime: number) => {
    clear()
    const events = session.events

    // 1. Locate nearest checkpoint event before or at targetTime
    let bestCheckpointIdx = -1
    for (let i = 0; i < events.length; i++) {
      if (events[i].time > targetTime) break
      if (events[i].type === "c" && events[i].checkpoint) {
        bestCheckpointIdx = i
      }
    }

    let startIdx = 0
    if (bestCheckpointIdx !== -1) {
      const cpEvent = events[bestCheckpointIdx]
      if (cpEvent.checkpoint?.screen_buffer) {
        terminalRef.current?.write(cpEvent.checkpoint.screen_buffer)
      }
      startIdx = bestCheckpointIdx + 1
    }

    // 2. Replay delta events from startIdx up to targetTime
    let latestTelem: TelemetryData | null = null
    for (let i = startIdx; i < events.length; i++) {
      if (events[i].time > targetTime) break
      const e = events[i]
      if (e.type === "o" && e.data) {
        terminalRef.current?.write(e.data)
      } else if (e.type === "p" && e.telemetry) {
        latestTelem = e.telemetry
      }
      eventIndex.current = i + 1
    }

    if (latestTelem) {
      setCurrentTelemetry(latestTelem)
    }

    setCurrentTime(targetTime)
    if (isPlaying) {
      lastWallTime.current = Date.now()
      lastReplayTime.current = targetTime
      rafRef.current = requestAnimationFrame(tick)
    } else {
      lastReplayTime.current = targetTime
    }
  }, [session, isPlaying, tick, clear])

  const changeSpeed = useCallback((s: number) => {
    setSpeed(s)
    if (isPlaying) {
      lastWallTime.current = Date.now()
      lastReplayTime.current = currentTime
    }
  }, [isPlaying, currentTime])

  return (
    <PlayerContext.Provider value={{
      isPlaying, currentTime, duration, speed, skipIdle, searchIndex, waveform, terminalRef, currentTelemetry,
      play, pause, seek, changeSpeed, toggleSkipIdle
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider")
  return context
}