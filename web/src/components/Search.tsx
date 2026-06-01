"use client"

import { useState } from "react"
import { SearchIndex, SearchResult, searchIndex } from "@/lib/replay-parser"

interface SearchProps {
  index: SearchIndex
  onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function Search({ index, onSeek }: SearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      setResults(searchIndex(index, value))
    } else {
      setResults([])
    }
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <input
        type="text"
        placeholder="Search terminal output..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "#222",
          color: "#eee",
          border: "1px solid #444",
          borderRadius: "6px",
          fontSize: "14px",
          outline: "none",
        }}
      />

      {results.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            maxHeight: "200px",
            overflowY: "auto",
            background: "#111",
            borderRadius: "6px",
            border: "1px solid #333",
          }}
        >
          {results.map((result, i) => (
            <div
              key={i}
              onClick={() => onSeek(result.time)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #222",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1a1a2e")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  color: "#3b82f6",
                  fontWeight: "bold",
                  fontSize: "13px",
                  minWidth: "50px",
                }}
              >
                {formatTime(result.time)}
              </span>
              <span
                style={{
                  color: "#aaa",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {result.context}
              </span>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div style={{ color: "#666", fontSize: "13px", marginTop: "6px" }}>
          No matches found.
        </div>
      )}
    </div>
  )
}
