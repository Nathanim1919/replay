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
  Sparkles,
  Trash2,
  Tag,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
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
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
      toast.success("Title updated successfully!");
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
      toast.success("Session URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) {
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
      toast.success("Recording deleted successfully");
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
    <div id="recordings" className="bg-gray-100 min-h-screen py-12">
      <div className="w-[95%] md:w-[80%] max-w-6xl mx-auto space-y-8">
        
        {/* TOP DASHBOARD HEADER & SEARCH BAR */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-tight text-gray-500 uppercase font-sans mb-1">
                <Terminal className="w-4 h-4 text-black" />
                <span>Dashboard & Session History</span>
              </div>
              <h1 className="font-extrabold text-3xl sm:text-4xl text-black tracking-tight">
                Your Recorded Sessions
              </h1>
              <p className="text-sm text-gray-600 mt-1 max-w-xl">
                Replay, share, or embed your CLI terminal events.
              </p>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or shell..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* STATS ROW */}
          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-xs text-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-black font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 font-mono text-[11px] block">Total Sessions</span>
                  <strong className="text-black font-extrabold text-sm">{sessions.length}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-black font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 font-mono text-[11px] block">Total Recorded Time</span>
                  <strong className="text-black font-extrabold text-sm">{formatDuration(totalDuration)}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-black font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 font-mono text-[11px] block">Status</span>
                  <strong className="text-emerald-600 font-extrabold text-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active CLI Linked
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TAG FILTER BAR */}
          {!loading && allTags.length > 0 && (
            <div className="pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-gray-400 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  selectedTag === null
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                All ({sessions.length})
              </button>
              {allTags.map((tag) => {
                const count = sessions.filter((s) => s.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedTag === tag
                        ? "bg-black text-white text-semibold shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="p-12 text-center bg-white border border-gray-300 rounded-2xl shadow-sm space-y-3">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Loading terminal recordings...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && sessions.length === 0 && (
          <div className="p-12 text-center bg-white border border-gray-300 rounded-2xl shadow-sm space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center text-black mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-black tracking-tight">No recordings found</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Run <code className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded font-mono text-black font-bold">$ replay record</code> in your terminal to record your first session.
            </p>
          </div>
        )}

        {/* SESSIONS GRID */}
        {!loading && filteredSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="group rounded-2xl border border-gray-300 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* PREVIEW CONTAINER */}
                <div className="h-60 bg-black relative overflow-hidden">
                  <Image
                    src={TerminalImage}
                    alt="Terminal Preview"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* OVERLAY BADGES */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                    <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold text-white">
                      {session.shell || "zsh"}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold text-gray-300">
                      {session.width || 80}x{session.height || 24}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold text-emerald-400">
                      {formatDuration(session.duration)}
                    </span>
                  </div>

                  {/* PLAY OVERLAY BUTTON */}
                  <Link
                    href={`/s/${session.shortcode}`}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer">
                      <Play className="w-6 h-6 fill-black ml-1" />
                    </div>
                  </Link>
                </div>

                {/* CARD FOOTER META & ACTIONS */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    {isEditing === session.id ? (
                      <div className="flex items-center gap-2 w-full">
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
                          className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-black font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                          autoFocus
                        />
                        <button
                          onClick={() => handleTitleChange(session.id, session.title)}
                          className="p-2 rounded-lg bg-black text-white hover:bg-gray-800 transition shrink-0 cursor-pointer"
                          title="Save Title"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-base font-extrabold text-black tracking-tight truncate">
                        {session.title || "Untitled Session"}
                      </h3>
                    )}

                    {isEditing !== session.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setIsEditing(session.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                          title="Rename Session"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TAGS LIST & ADD TAG BUTTON */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                    {session.tags && session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 border border-gray-300 font-mono text-gray-700 font-semibold text-[10px]"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(session.id, tag)}
                          className="hover:text-red-600 cursor-pointer ml-0.5"
                          title="Remove Tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {addingTagId === session.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="tag name..."
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
                          className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black w-24"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTag(session.id, tagInputValue)}
                          className="p-1 bg-black text-white rounded hover:bg-gray-800 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingTagId(null);
                            setTagInputValue("");
                          }}
                          className="p-1 text-gray-500 hover:text-black cursor-pointer"
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-500 hover:text-black transition cursor-pointer text-[10px] font-bold"
                        title="Add Custom Tag"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tag</span>
                      </button>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(session.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEmbedModalSession(session)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-black font-extrabold text-[11px] border border-gray-300 transition cursor-pointer"
                        title="Get Embed Code"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Embed</span>
                      </button>

                      <button
                        onClick={() => handleShare(session.shortcode)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 font-extrabold text-[11px] transition cursor-pointer"
                        title="Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-black" />
                <h3 className="text-xl font-extrabold text-black tracking-tight">Embed Session</h3>
              </div>
              <button
                onClick={() => {
                  setEmbedModalSession(null);
                  setCopiedEmbed(false);
                  setCopiedLink(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DIRECT URL */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold tracking-tight uppercase text-gray-500 block">
                Direct Share Link
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-mono text-xs text-black">
                <span className="truncate flex-1 select-all font-semibold">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/s/${embedModalSession.shortcode}`
                    : `/s/${embedModalSession.shortcode}`}
                </span>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/s/${embedModalSession.shortcode}`;
                    await navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    toast.success("Link copied!");
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-extrabold hover:bg-gray-800 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* IFRAME EMBED CODE */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold tracking-tight uppercase text-gray-500 block">
                IFrame Embed Snippet
              </label>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs text-neutral-200 relative overflow-x-auto">
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
                  toast.success("IFrame snippet copied!");
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black text-white font-extrabold text-xs hover:bg-gray-800 transition cursor-pointer mt-2"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Embed Code</span>
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
