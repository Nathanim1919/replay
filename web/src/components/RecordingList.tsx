"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Player from "@/components/Player";

interface Session {
  id: string;
  shortcode: string;
  title: string;
  preview?: string;
  duration: number;
  width: number;
  height: number;
  shell: string;
  created_at: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecordingList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      fetch("/api/recordings")
        .then((res) => res.json())
        .then((data) => {
          setSessions(data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchSessions();
  }, []);

  return (
    <div className="bg-white p-2 w-full mx-auto">
      <div className="flex justify-between">
        <h1
          style={{
            color: "#3b82f6",
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          Replay
        </h1>
        <span style={{ color: "#666", fontSize: "14px" }}>
          Hey {user?.name || "there"}! You have {sessions.length} session
          {sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && (
        <div
          style={{
            color: "#666",
            fontSize: "16px",
            textAlign: "center",
            marginTop: "48px",
          }}
        >
          Loading sessions...
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div
          style={{
            color: "#666",
            fontSize: "16px",
            textAlign: "center",
            marginTop: "48px",
          }}
        >
          No sessions yet. Record one with:{" "}
          <code style={{ color: "#3b82f6" }}>replay record</code>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sessions.map((session) => (
        <div
  key={session.id}
  onMouseEnter={() => setHoveredId(session.id)}
  onMouseLeave={() => setHoveredId(null)}
  className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-blue-500 transition"
>
  {/* PREVIEW AREA */}
  <div className="h-65 bg-black overflow-hidden relative">

    {hoveredId === session.id ? (
      <Player
        content={session.preview!}
        mode="preview"
        autoPlay
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
        Hover to preview
      </div>
    )}

  </div>

  {/* META */}
  <div className="p-3">
    <div className="text-white font-medium truncate">
      {session.title}
    </div>

    <div className="text-xs text-zinc-500 mt-1">
      {session.shell} · {session.width}×{session.height}
    </div>
  </div>
</div>
        ))}
      </div>
    </div>
  );
}
