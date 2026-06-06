"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

interface Session {
  id: string
  shortcode: string
  title: string
  duration: number
  width: number
  height: number
  shell: string
  created_at: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const {user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      fetch("/api/recordings")
        .then((res) => res.json())
        .then((data) => {
          setSessions(data || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    fetchSessions()
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div>
        <div className="w-[70%] mx-auto flex justify-between">
          <h1 style={{ color: "#3b82f6", fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            Replay
          </h1>
          <span style={{ color: "#666", fontSize: "14px" }}>
            Hey {user?.name || "there"}! You have {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading && (
          <div style={{ color: "#666", fontSize: "16px", textAlign: "center", marginTop: "48px" }}>
            Loading sessions...
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ color: "#666", fontSize: "16px", textAlign: "center", marginTop: "48px" }}>
            No sessions yet. Record one with: <code style={{ color: "#3b82f6" }}>replay record</code>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/s/${session.shortcode}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "#161616",
                  borderRadius: "8px",
                  border: "1px solid #222",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
              >
                <div>
                  <div style={{ color: "#eee", fontSize: "15px", fontWeight: 500 }}>
                    {session.title}
                  </div>
                  <div style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
                    {session.shell} · {session.width}x{session.height} · {formatDate(session.created_at)}
                  </div>
                </div>
                <div style={{ color: "#888", fontSize: "14px", fontFamily: "monospace" }}>
                  {formatTime(session.duration)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
