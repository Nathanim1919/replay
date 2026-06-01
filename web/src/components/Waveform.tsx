"use client"

interface WaveformProps {
  bars: number[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export default function Waveform({ bars, currentTime, duration, onSeek }: WaveformProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    onSeek(percent * duration)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: "relative",
        width: "100%",
        height: "48px",
        display: "flex",
        alignItems: "flex-end",
        gap: "1px",
        cursor: "pointer",
        background: "#111",
        borderRadius: "4px",
        padding: "4px",
        overflow: "hidden",
      }}
    >
      {bars.map((height, i) => {
        const barPercent = ((i + 0.5) / bars.length) * 100
        const isPast = barPercent < progressPercent

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(height * 100, 2)}%`,
              background: isPast ? "#3b82f6" : "#444",
              borderRadius: "1px",
              transition: "background 0.1s",
            }}
          />
        )
      })}

      {/* Playhead line */}
      <div
        style={{
          position: "absolute",
          left: `${progressPercent}%`,
          top: 0,
          bottom: 0,
          width: "2px",
          background: "#fff",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
