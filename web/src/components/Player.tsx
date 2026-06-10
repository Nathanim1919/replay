"use client"

import { parseReplay, computeWaveform, buildSearchIndex, ReplaySession, SearchIndex } from "@/lib/replay-parser"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Terminal, { TerminalHandle } from "./Terminal"
import Waveform from "./Waveform"
import Search from "./Search"

interface PlayerProps {
  content: string
  demo?: boolean
}

export const Player = ({ content, demo = false }: PlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [currentTime, setCurrentTime] = useState(0)
  const terminalRef = useRef<TerminalHandle>(null)
  const anchorWallRef = useRef<number>(0)
  const anchorReplayRef = useRef<number>(0)
  const eventIndexRef = useRef<number>(0)
  const rafIdRef = useRef<number>(0)
  const speedRef = useRef<number>(1.0)
  const session = useMemo(() => parseReplay(content), [content])
  const sessionRef = useRef<ReplaySession>(session)

  sessionRef.current = session
  const demoRef = useRef(demo)
  demoRef.current = demo

  // Keep speedRef in sync with speed state
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const tick = useCallback(() => {
    const session = sessionRef.current
    if (!session) return

    const wallElapsed = Date.now() - anchorWallRef.current
    const replayTime = anchorReplayRef.current + (wallElapsed / 1000) * speedRef.current

    // Flush events up to replayTime
    while (
      eventIndexRef.current < session.events.length &&
      session.events[eventIndexRef.current].time <= replayTime
    ) {
      const event = session.events[eventIndexRef.current]
      if (event.type === "o" && event.data) {
        terminalRef.current?.write(event.data)
      }
      eventIndexRef.current++
    }

    // Update current time for UI
    setCurrentTime(replayTime)

    // Check if done
    if (eventIndexRef.current >= session.events.length) {
      if (demoRef.current) {
        // Loop: reset and restart after a brief pause
        setTimeout(() => {
          terminalRef.current?.reset()
          eventIndexRef.current = 0
          anchorWallRef.current = Date.now()
          anchorReplayRef.current = 0
          setCurrentTime(0)
          rafIdRef.current = requestAnimationFrame(tick)
        }, 2000)
      } else {
        setIsPlaying(false)
      }
      return
    }

    // Schedule next tick
    rafIdRef.current = requestAnimationFrame(tick)
  }, [])

  const startPlayback = useCallback(() => {
    if (!sessionRef.current) return

    anchorWallRef.current = Date.now()
    anchorReplayRef.current = currentTime
    setIsPlaying(true)
    rafIdRef.current = requestAnimationFrame(tick)
  }, [currentTime, tick])

  const pausePlayback = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)
    setIsPlaying(false)
  }, [])

  const seekTo = useCallback(
    (time: number) => {
      const session = sessionRef.current
      if (!session) return

      // Reset terminal — clear all state
      terminalRef.current?.reset()

      // Replay all events from 0 to target time (no delays)
      eventIndexRef.current = 0
      for (let i = 0; i < session.events.length; i++) {
        if (session.events[i].time > time) break
        if (session.events[i].type === "o" && session.events[i].data) {
          terminalRef.current?.write(session.events[i].data!)
        }
        eventIndexRef.current = i + 1
      }

      // Update position
      setCurrentTime(time)

      // If playing, re-anchor from new position
      if (isPlaying) {
        cancelAnimationFrame(rafIdRef.current)
        anchorWallRef.current = Date.now()
        anchorReplayRef.current = time
        rafIdRef.current = requestAnimationFrame(tick)
      } else {
        anchorReplayRef.current = time
      }
    },
    [isPlaying, tick]
  )

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed)
      speedRef.current = newSpeed
      if (isPlaying) {
        // Re-anchor so timing stays correct
        cancelAnimationFrame(rafIdRef.current)
        anchorWallRef.current = Date.now()
        anchorReplayRef.current = currentTime
        rafIdRef.current = requestAnimationFrame(tick)
      }
    },
    [isPlaying, currentTime, tick]
  )

  // Auto-play in demo mode
  useEffect(() => {
    if (demo) {
      anchorWallRef.current = Date.now()
      anchorReplayRef.current = 0
      eventIndexRef.current = 0
      setIsPlaying(true)
      rafIdRef.current = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [demo, tick])

  const duration = session.events[session.events.length - 1]?.time ?? 0
  const waveformBars = useMemo(
    () => computeWaveform(session.events, 150),
    [session]
  )
  const searchIdx = useMemo(
    () => buildSearchIndex(session.events),
    [session]
  )

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (demo) {
    return (
      <div>
        <Terminal
          ref={terminalRef}
          width={session.header.width}
          height={session.header.height}
        />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      padding: "24px",
      fontFamily: "'Manrope', -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          padding: "12px 16px",
          background: "#161616",
          borderRadius: "8px",
          border: "1px solid #222",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#3b82f6", fontWeight: "bold", fontSize: "18px" }}>
              Replay
            </span>
            <span style={{ color: "#444", fontSize: "14px" }}>
              {session.header.width}x{session.header.height}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#666", fontSize: "13px" }}>
              {session.header.shell}
            </span>
            <span style={{ color: "#666", fontSize: "13px" }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Terminal */}
        <div>
          <Terminal
            ref={terminalRef}
            width={session.header.width}
            height={session.header.height}
          />
        </div>

        {/* Waveform */}
        <div style={{ marginTop: "12px" }}>
          <Waveform
            bars={waveformBars}
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
          />
        </div>

        {/* Controls */}
        <div>
          <button
            onClick={isPlaying ? pausePlayback : startPlayback}
            style={{
              padding: "6px 18px",
              background: isPlaying ? "#ef4444" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                style={{
                  padding: "4px 12px",
                  background: speed === s ? "#3b82f6" : "#262626",
                  color: speed === s ? "white" : "#888",
                  border: speed === s ? "1px solid #60a5fa" : "1px solid #333",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {s}x
              </button>
            ))}
          </div>


          <span style={{
            color: "#888",
            fontSize: "13px",
            marginLeft: "auto",
            fontFamily: "monospace",
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Search */}
        <Search index={searchIdx} onSeek={seekTo} />
      </div>
    </div>
  )
}

export default Player
