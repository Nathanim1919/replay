"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Pencil,
  Play,
  Share2,
  Search,
  Check,
  Code,
  Terminal,
  Clock,
  Calendar,
  Layers,
  Copy,
  X,
  Trash2,
  Tag,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToSvg } from "@/lib/export-utils";
import Link from "next/link";
import TerminalImage from "../../public/terminal.png";
import Image from "next/image";

interface Session {
  id: string;
  shortcode: string;
  title: string;
  tags?: string[];
  preview?: string;
  duration: number;
  width: number;
  height: number;
  shell: string;
  created_at: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function RecordingList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [addingTagId, setAddingTagId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState("");
  const [embedModalSession, setEmbedModalSession] = useState<Session | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/recordings");
      if (res.ok) {
        const data = await res.json();
        setSessions(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTitleChange = async (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
    setIsEditing(null);

    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        throw new Error("Failed to update title");
      }
      toast.success("Title updated");
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title");
      fetchSessions();
    }
  };

  const handleShare = async (shortcode: string) => {
    if (typeof window === "undefined") return;
    try {
      const url = `${window.location.origin}/s/${shortcode}`;
      await navigator.clipboard.writeText(url);
      toast.success("Session URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this recording?")) {
      return;
    }

    try {
      const res = await fetch(`/api/recordings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete session");
      }

      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Recording deleted");
    } catch (err) {
      console.error("Delete recording error:", err);
      toast.error("Failed to delete recording");
    }
  };

  const handleAddTag = async (id: string, tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase().replace(/^#/, "");
    if (!cleanTag) return;

    const target = sessions.find((s) => s.id === id);
    if (!target) return;

    const existingTags = target.tags || [];
    if (existingTags.includes(cleanTag)) {
      setAddingTagId(null);
      setTagInputValue("");
      return;
    }

    const updatedTags = [...existingTags, cleanTag];
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tags: updatedTags } : s))
    );
    setAddingTagId(null);
    setTagInputValue("");

    try {
      await fetch(`/api/recordings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      toast.success(`Tag #${cleanTag} added`);
    } catch (err) {
      console.error("Failed to add tag:", err);
      toast.error("Failed to save tag");
      fetchSessions();
    }
  };

  const handleRemoveTag = async (id: string, tagToRemove: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;

    const updatedTags = (target.tags || []).filter((t) => t !== tagToRemove);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tags: updatedTags } : s))
    );

    try {
      await fetch(`/api/recordings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      toast.success(`Tag #${tagToRemove} removed`);
    } catch (err) {
      console.error("Failed to remove tag:", err);
      toast.error("Failed to remove tag");
      fetchSessions();
    }
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        s.title.toLowerCase().includes(query) ||
        (s.shell && s.shell.toLowerCase().includes(query)) ||
        s.shortcode.toLowerCase().includes(query) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(query)));

      const matchesTag = !selectedTag || (s.tags && s.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [sessions, searchQuery, selectedTag]);

  const totalDuration = useMemo(() => {
    return sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }, [sessions]);

  return (
    <div id="recordings" className="bg-black text-white min-h-screen py-10 font-mono selection:bg-emerald-500 selection:text-black">
      <div className="w-[95%] md:w-[85%] max-w-6xl mx-auto space-y-6">
        
        {/* DASHBOARD HEADER & SEARCH BAR */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>TERMINAL RECORDING REPOSITORY</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                RECORDED SESSIONS
              </h1>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-zinc-800 pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TELEMETRY STATS ROW */}
          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-black border border-zinc-900 p-3">
                <span className="text-zinc-500 text-[10px] uppercase block mb-1">TOTAL RECORDINGS</span>
                <strong className="text-white font-bold text-base tabular-nums">{sessions.length}</strong>
              </div>

              <div className="bg-black border border-zinc-900 p-3">
                <span className="text-zinc-500 text-[10px] uppercase block mb-1">CUMULATIVE DURATION</span>
                <strong className="text-white font-bold text-base tabular-nums">{formatDuration(totalDuration)}</strong>
              </div>

              <div className="bg-black border border-zinc-900 p-3 col-span-2 sm:col-span-1">
                <span className="text-zinc-500 text-[10px] uppercase block mb-1">CLI STATUS</span>
                <strong className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                  AUTHENTICATED
                </strong>
              </div>
            </div>
          )}

          {/* TAG FILTER BAR */}
          {!loading && allTags.length > 0 && (
            <div className="pt-3 border-t border-zinc-900 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" />
                TAGS:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-1 text-xs border transition cursor-pointer ${
                  selectedTag === null
                    ? "bg-white text-black border-white font-bold"
                    : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                ALL ({sessions.length})
              </button>
              {allTags.map((tag) => {
                const count = sessions.filter((s) => s.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 text-xs border transition cursor-pointer flex items-center gap-1 ${
                      selectedTag === tag
                        ? "bg-white text-black border-white font-bold"
                        : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="p-10 text-center bg-zinc-950 border border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">LOADING RECORDINGS...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && sessions.length === 0 && (
          <div className="p-10 text-center bg-zinc-950 border border-zinc-800 space-y-3 max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">NO RECORDINGS AVAILABLE</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Execute <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-emerald-400">$ replay record</code> in your shell to record a session.
            </p>
          </div>
        )}

        {/* SESSIONS GRID */}
        {!loading && filteredSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
              >
                {/* PREVIEW CONTAINER */}
                <div className="h-56 bg-black relative border-b border-zinc-900 overflow-hidden group">
                  <Image
                    src={TerminalImage}
                    alt="Terminal Preview"
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition duration-300"
                  />

                  {/* OVERLAY BADGES */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                    <span className="px-2 py-0.5 bg-black/90 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                      {session.shell || "bash"}
                    </span>
                    <span className="px-2 py-0.5 bg-black/90 border border-zinc-800 font-mono text-[10px] text-zinc-400">
                      {session.width || 80}x{session.height || 24}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <span className="px-2 py-0.5 bg-black/90 border border-zinc-800 font-mono text-[10px] text-emerald-400 tabular-nums">
                      {formatDuration(session.duration)}
                    </span>
                  </div>

                  {/* PLAY OVERLAY LINK */}
                  <Link
                    href={`/s/${session.shortcode}`}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-80 group-hover:opacity-100 transition z-10"
                  >
                    <div className="w-12 h-12 bg-white text-black flex items-center justify-center transition hover:bg-emerald-400 cursor-pointer">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </Link>
                </div>

                {/* CARD FOOTER META & ACTIONS */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {isEditing === session.id ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={session.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setSessions((prev) =>
                              prev.map((s) =>
                                s.id === session.id ? { ...s, title: newTitle } : s
                              )
                            );
                          }}
                          className="w-full bg-black border border-zinc-800 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => handleTitleChange(session.id, session.title)}
                          className="p-1.5 bg-white text-black hover:bg-zinc-200 transition shrink-0 cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {session.title || "UNTITLED SESSION"}
                      </h3>
                    )}

                    {isEditing !== session.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setIsEditing(session.id)}
                          className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TAGS LIST & ADD TAG BUTTON */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    {session.tags && session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(session.id, tag)}
                          className="hover:text-red-400 cursor-pointer ml-0.5"
                          title="Remove Tag"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    {addingTagId === session.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="tag..."
                          value={tagInputValue}
                          onChange={(e) => setTagInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddTag(session.id, tagInputValue);
                            } else if (e.key === "Escape") {
                              setAddingTagId(null);
                              setTagInputValue("");
                            }
                          }}
                          className="bg-black border border-zinc-800 px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-emerald-500 w-20"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTag(session.id, tagInputValue)}
                          className="p-0.5 bg-white text-black hover:bg-zinc-200 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingTagId(null);
                            setTagInputValue("");
                          }}
                          className="p-0.5 text-zinc-500 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingTagId(session.id);
                          setTagInputValue("");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition cursor-pointer text-[10px]"
                        title="Add Tag"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>TAG</span>
                      </button>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                      <Calendar className="w-3 h-3 text-zinc-600" />
                      <span>{formatDate(session.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          exportToSvg(session.title || "recording", ["$ replay record", `Shell: ${session.shell || "bash"}`, `Duration: ${formatDuration(session.duration)}`]);
                          toast.success("Exported SVG preview");
                        }}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] border border-zinc-800 transition cursor-pointer flex items-center gap-1"
                        title="Export SVG Preview"
                      >
                        <Download className="w-3 h-3" />
                        <span>SVG</span>
                      </button>

                      <button
                        onClick={() => setEmbedModalSession(session)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] border border-zinc-800 transition cursor-pointer flex items-center gap-1"
                        title="Get Embed Code"
                      >
                        <Code className="w-3 h-3" />
                        <span>EMBED</span>
                      </button>

                      <button
                        onClick={() => handleShare(session.shortcode)}
                        className="px-2.5 py-1 bg-white text-black hover:bg-zinc-200 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                        title="Share Link"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>SHARE</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* EMBED MODAL */}
      {embedModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">EMBED CODE SNIPPET</h3>
              </div>
              <button
                onClick={() => {
                  setEmbedModalSession(null);
                  setCopiedEmbed(false);
                  setCopiedLink(false);
                }}
                className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DIRECT URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                Direct Share Link
              </label>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 text-xs text-white font-mono">
                <span className="truncate flex-1 select-all text-zinc-300">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/s/${embedModalSession.shortcode}`
                    : `/s/${embedModalSession.shortcode}`}
                </span>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/s/${embedModalSession.shortcode}`;
                    await navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    toast.success("Link copied");
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-white text-black text-[10px] font-bold hover:bg-zinc-200 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? "COPIED" : "COPY"}
                </button>
              </div>
            </div>

            {/* IFRAME EMBED CODE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                IFrame HTML Snippet
              </label>
              <div className="bg-black border border-zinc-800 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <code>
                  {`<iframe src="${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/embed/${embedModalSession.shortcode}" width="100%" height="400" frameborder="0"></iframe>`}
                </code>
              </div>
              <button
                onClick={async () => {
                  const snippet = `<iframe src="${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/embed/${embedModalSession.shortcode}" width="100%" height="400" frameborder="0"></iframe>`;
                  await navigator.clipboard.writeText(snippet);
                  setCopiedEmbed(true);
                  toast.success("IFrame snippet copied");
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer mt-2"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY IFRAME CODE</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
