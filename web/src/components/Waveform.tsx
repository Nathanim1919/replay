"use client"

import { useState } from "react"

interface WaveformProps {
  bars: number[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function Waveform({ bars, currentTime, duration, onSeek }: WaveformProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState<number>(0)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percent = x / rect.width
    setHoverX(x)
    setHoverTime(percent * duration)
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percent = x / rect.width
    onSeek(percent * duration)
  }

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-11 flex items-end gap-[1.5px] cursor-pointer bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-1.5 overflow-hidden group select-none transition-colors hover:border-zinc-700/80"
    >
      {bars.map((height, i) => {
        const barPercent = ((i + 0.5) / bars.length) * 100
        const isPast = barPercent <= progressPercent

        return (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-colors duration-100 ${
              isPast
                ? "bg-gradient-to-t from-orange-600 to-amber-500 shadow-xs"
                : "bg-zinc-800/80 group-hover:bg-zinc-700/80"
            }`}
            style={{
              height: `${Math.max(height * 100, 6)}%`,
            }}
          />
        )
      })}

      {/* Progress Playhead Line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] pointer-events-none transition-all duration-75"
        style={{ left: `${progressPercent}%` }}
      />

      {/* Hover Timestamp Tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute -top-7 z-30 transform -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-mono text-white shadow-xl pointer-events-none"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  )
}
