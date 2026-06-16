"use client"

import { useState } from "react"
import { SearchIndex, SearchResult, searchIndex } from "@/lib/replay-parser"
import { usePlayer } from "@/hooks/usePlayer"

interface SearchProps {
  index: SearchIndex
  onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function SearchContent() {
  const {searchIndex: index, seek: onSeek} = usePlayer()
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
    <div className="w-full mt-3 font-mono p-2">
      <input
        type="text"
        placeholder="Search terminal output..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-md text-sm outline-none placeholder-zinc-500 focus:border-zinc-700 transition-colors"
      />

      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-md divide-y divide-zinc-900 custom-scrollbar">
          {results.map((result, i) => (
            <div
              key={i}
              onClick={() => onSeek(result.time)}
              className="px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors hover:bg-zinc-900 text-left"
            >
              <span className="text-blue-400 font-bold text-xs min-w-[45px]">
                {formatTime(result.time)}
              </span>
              <span className="text-zinc-400 text-xs truncate whitespace-nowrap flex-1">
                {result.context}
              </span>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div className="text-zinc-600 text-xs mt-2 px-1">
          No matches found.
        </div>
      )}
    </div>
  )
}