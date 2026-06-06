"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Player from "@/components/Player"

export default function SessionPage() {
  const { shortcode } = useParams<{ shortcode: string }>()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/recordings/${shortcode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found")
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [shortcode])

  if (error) return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ef4444",
      fontSize: "16px",
    }}>
      {error}
    </div>
  )

  if (!content) return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#666",
      fontSize: "16px",
    }}>
      Loading session...
    </div>
  )

  return <Player content={content} />
}
