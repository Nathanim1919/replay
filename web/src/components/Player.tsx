"use client"

import { parseReplay, ReplaySession } from "@/lib/replay-parser"
import { useEffect, useRef, useState, useCallback } from "react"
import Terminal, { TerminalHandle } from "./Terminal"

export const Player = () => {
  const [session, setSession] = useState<ReplaySession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [currentTime, setCurrentTime] = useState(0)

  const terminalRef = useRef<TerminalHandle>(null)
  const anchorWallRef = useRef<number>(0)
  const anchorReplayRef = useRef<number>(0)
  const eventIndexRef = useRef<number>(0)
  const rafIdRef = useRef<number>(0)
  const speedRef = useRef<number>(1.0)
  const sessionRef = useRef<ReplaySession | null>(null)

  // Load the replay file
  useEffect(() => {
    fetch("/test.replay")
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseReplay(text)
        setSession(parsed)
        sessionRef.current = parsed
      })
  }, [])

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
      setIsPlaying(false)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [])

  if (!session) return <div>Loading...</div>

  const duration = session.events[session.events.length - 1]?.time ?? 0

  return (
    <div style={{ padding: "20px", background: "#1a1a1a", minHeight: "100vh" }}>
      <Terminal
        ref={terminalRef}
        width={session.header.width}
        height={session.header.height}
      />

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={isPlaying ? pausePlayback : startPlayback}
          style={{
            padding: "8px 20px",
            background: isPlaying ? "#ef4444" : "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        {[1, 2, 4, 8].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
            style={{
              padding: "6px 14px",
              background: speed === s ? "#3b82f6" : "#333",
              color: "white",
              border: speed === s ? "2px solid #60a5fa" : "2px solid transparent",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {s}x
          </button>
        ))}

        <span style={{ color: "#888", fontSize: "13px", marginLeft: "12px" }}>
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
        </span>
      </div>

      <div style={{ marginTop: "8px" }}>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "#3b82f6",
          }}
        />
      </div>
    </div>
  )
}

export default Player
