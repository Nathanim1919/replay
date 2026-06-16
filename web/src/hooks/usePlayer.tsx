"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from "react"
import { parseReplay, computeWaveform, buildSearchIndex, SearchIndex } from "@/lib/replay-parser"

interface PlayerContextType {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  searchIndex: SearchIndex | null
  waveform: number[]
  terminalRef: React.RefObject<any>
  play: () => void
  pause: () => void
  seek: (time: number) => void
  changeSpeed: (speed: number) => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ content, children }: { content: string; children: React.ReactNode }) {
  const session = useMemo(() => parseReplay(content), [content])
  const terminalRef = useRef<any>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)

  const rafRef = useRef<number | null>(null)
  const lastWallTime = useRef<number>(0)
  const lastReplayTime = useRef<number>(0)
  const eventIndex = useRef(0)
  const speedRef = useRef(speed)

  useEffect(() => { speedRef.current = speed }, [speed])

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
    const replayTime = lastReplayTime.current + delta * speedRef.current
    const events = session.events

    while (eventIndex.current < events.length && events[eventIndex.current].time <= replayTime) {
      const e = events[eventIndex.current]
      if (e.type === "o" && e.data) terminalRef.current?.write(e.data)
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

  const seek = useCallback((time: number) => {
    clear()
    const events = session.events
    for (let i = 0; i < events.length; i++) {
      if (events[i].time > time) break
      if (events[i].type === "o" && events[i].data) terminalRef.current?.write(events[i].data)
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
      isPlaying, currentTime, duration, speed, searchIndex, waveform, terminalRef,
      play, pause, seek, changeSpeed
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