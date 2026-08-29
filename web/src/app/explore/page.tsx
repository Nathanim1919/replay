"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Terminal,
  Search,
  Play,
  Share2,
  Code,
  Tag,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import TerminalImage from "../../../public/terminal.png";
import Footer from "@/components/landing/Footer";

interface PublicSession {
  id: string;
  shortcode: string;
  title: string;
  tags?: string[];
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

export default function ExplorePage() {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [embedModalSession, setEmbedModalSession] = useState<PublicSession | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchPublicSessions = async () => {
      try {
        const res = await fetch("/api/recordings/public");
        if (res.ok) {
          const data = await res.json();
          setSessions(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch public recordings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicSessions();
  }, []);

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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-black font-sans flex flex-col justify-between selection:bg-stone-200">
      <div>
        {/* HEADER / NAVIGATION */}
        <header className="sticky top-0 z-40 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-300">
          <div className="w-[95%] md:w-[85%] max-w-7xl mx-auto h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-black">
                Replay
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/explore"
                className="text-xs font-extrabold tracking-tight uppercase text-black underline underline-offset-4"
              >
                Explore
              </Link>
              <Link
                href="/#recordings"
                className="text-xs font-extrabold tracking-tight uppercase text-stone-600 hover:text-black transition"
              >
                Dashboard
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-extrabold tracking-tight hover:bg-stone-800 transition cursor-pointer shadow-xs"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </nav>
          </div>
        </header>

        {/* MAIN EXPLORE CONTENT */}
        <main className="w-[95%] md:w-[85%] max-w-7xl mx-auto py-12 space-y-10">
          {/* HERO TITLE SECTION */}
          <div className="bg-white border border-stone-300 rounded-3xl p-8 sm:p-12 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-100 border border-stone-300 text-xs font-mono font-bold text-stone-700 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Public Replay Directory</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black leading-none">
                  Explore Community Replays
                </h1>
                <p className="text-stone-600 text-base sm:text-lg font-medium leading-relaxed">
                  Discover interactive terminal recordings, CLI workflow demos, and developer debug sessions shared across the community.
                </p>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by title, tool, command or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-11 pr-4 py-3 text-xs text-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* TAG FILTER CHIPS BAR */}
            {!loading && allTags.length > 0 && (
              <div className="pt-6 border-t border-stone-200 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-stone-500 flex items-center gap-1 mr-2">
                  <Tag className="w-3.5 h-3.5 text-black" />
                  Categories:
                </span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-tight transition cursor-pointer ${
                    selectedTag === null
                      ? "bg-black text-white"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-tight transition cursor-pointer flex items-center gap-1.5 ${
                        selectedTag === tag
                          ? "bg-black text-white"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className="opacity-60 text-[10px] font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="p-16 text-center bg-white border border-stone-300 rounded-3xl shadow-xs space-y-4">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-stone-600">Fetching community recordings...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredSessions.length === 0 && (
            <div className="p-16 text-center bg-white border border-stone-300 rounded-3xl shadow-xs space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-300 flex items-center justify-center text-black mx-auto">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-black tracking-tight">No recordings match filter</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                Try searching for another CLI tool, tag, or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-black text-xs font-extrabold border border-stone-300 transition cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* SESSIONS GRID */}
          {!loading && filteredSessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="group rounded-3xl border border-stone-300 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  {/* PREVIEW CONTAINER */}
                  <div className="h-56 bg-black relative overflow-hidden">
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
                      <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold text-stone-300">
                        {session.width || 80}x{session.height || 24}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-20">
                      <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold text-emerald-400">
                        {formatDuration(session.duration)}
                      </span>
                    </div>

                    {/* PLAY BUTTON OVERLAY */}
                    <Link
                      href={`/s/${session.shortcode}`}
                      className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer">
                        <Play className="w-6 h-6 fill-black ml-1" />
                      </div>
                    </Link>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-extrabold text-black tracking-tight truncate">
                      {session.title || "Untitled Session"}
                    </h3>

                    {/* TAG CHIPS */}
                    <div className="flex items-center gap-1.5 flex-wrap min-h-6">
                      {session.tags && session.tags.length > 0 ? (
                        session.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className="px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 border border-stone-300 font-mono text-stone-700 font-bold text-[10px] transition cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))
                      ) : (
                        <span className="text-[11px] font-mono text-stone-400 italic">#terminal</span>
                      )}
                    </div>

                    {/* CARD FOOTER */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEmbedModalSession(session)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-black font-extrabold text-[11px] border border-stone-300 transition cursor-pointer"
                          title="Get Embed Code"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>Embed</span>
                        </button>

                        <button
                          onClick={() => handleShare(session.shortcode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black text-white hover:bg-stone-800 font-extrabold text-[11px] transition cursor-pointer"
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
        </main>
      </div>

      {/* EMBED CODE MODAL */}
      {embedModalSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-black" />
                <h3 className="font-extrabold text-xl text-black tracking-tight">
                  Embed Recording Snippet
                </h3>
              </div>
              <button
                onClick={() => {
                  setEmbedModalSession(null);
                  setCopiedEmbed(false);
                  setCopiedLink(false);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-black hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-stone-600 mb-1.5 uppercase">
                  iFrame Embed Code (HTML)
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${embedModalSession.shortcode}" width="800" height="500" frameborder="0" allowfullscreen></iframe>`}
                    className="w-full bg-stone-900 text-emerald-400 font-mono text-xs p-3.5 rounded-2xl focus:outline-none resize-none"
                  />
                  <button
                    onClick={async () => {
                      const snippet = `<iframe src="${window.location.origin}/embed/${embedModalSession.shortcode}" width="800" height="500" frameborder="0" allowfullscreen></iframe>`;
                      await navigator.clipboard.writeText(snippet);
                      setCopiedEmbed(true);
                      toast.success("iFrame snippet copied!");
                      setTimeout(() => setCopiedEmbed(false), 2000);
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmbed ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-600 mb-1.5 uppercase">
                  Direct Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${embedModalSession.shortcode}`}
                    className="w-full bg-stone-100 border border-stone-300 text-black font-mono text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      const link = `${window.location.origin}/s/${embedModalSession.shortcode}`;
                      await navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      toast.success("Direct link copied!");
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-black text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-stone-800 transition cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setEmbedModalSession(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-black font-extrabold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
