"use client";

import { useEffect, useState } from "react";
import { Pencil, Play, Share2, Search, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleTitleChange = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)),
    );
    try {
      const response = fetch(`/api/recordings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response) {
        throw new Error("Failed to update title");
      }
      toast.success("Title updated successfully!");
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title");
      // Optionally revert title change on error
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: s.title } : s)),
      );
    } finally {
      setIsEditing(null);
    }
  };

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
    <div className="bg-gray-100">
      <div className="p-2 w-[70%] mx-auto py-10">
        {!loading && sessions.length !== 0 && (
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="font-bold text-black text-3xl">
                Your Recent Recordings
              </h1>
              <p className="text-gray-500">
                You Play, Share Your Terminal Sessions with Friends and
                Colleagues. Click on a recording to view the full session.
              </p>
            </div>
            <button className="text-black/60 hover:text-black cursor-pointer ">
              <Search size={25} className="" />
            </button>
          </div>
        )}

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
            No sessions yet. Start recording your terminal sessions to see them
            here!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl hover:rounded-none transition-all duration-150 ease-in-out hover:shadow-2xl border border-zinc-200 bg-white overflow-hidden"
            >
              {/* PREVIEW AREA */}
              <div className="h-65 bg-black overflow-hidden relative">
                {/* <Player content={session.preview!} mode="preview" /> */}
                <Link
                  href={`/s/${session.shortcode}`}
                  className="w-full h-full bg-black/30 backdrop-blur-sm relative grid place-items-center z-1000"
                >
                  <Play
                    size={64}
                    className="p-1  cursor-pointer hover:text-red-500"
                  />
                </Link>
              </div>

              {/* META */}
              <div className="flex items-center justify-between p-4">
                {isEditing === session.id ? (
                  <input
                    type="text"
                    value={session.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setSessions((prev) =>
                        prev.map((s) =>
                          s.id === session.id ? { ...s, title: newTitle } : s,
                        ),
                      );
                    }}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-black"
                  />
                ) : (
                  <div className="text-black font-medium truncate">
                    {session.title}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  {isEditing === session.id ? (
                    <Check
                      onClick={() =>
                        handleTitleChange(session.id, session.title)
                      }
                      size={24}
                      className="p-1 hover:bg-gray-100 cursor-pointer"
                    />
                  ) : (
                    <Pencil
                      onClick={() => setIsEditing(session.id)}
                      size={24}
                      className="p-1 hover:bg-gray-100 cursor-pointer"
                    />
                  )}
                  <Share2
                    size={24}
                    className="p-1 hover:bg-gray-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
