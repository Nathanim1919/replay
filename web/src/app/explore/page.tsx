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
  Calendar,
  X,
  Copy,
  Check,
  Download,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { exportToSvg } from "@/lib/export-utils";
import TerminalImage from "../../../public/terminal.png";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

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
      toast.success("Session URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      <div>
        {/* HEADER / NAVIGATION */}
        <Header />

        {/* MAIN EXPLORE CONTENT */}
        <main className="w-[95%] md:w-[85%] max-w-6xl mx-auto py-10 space-y-6">
          
          {/* DASHBOARD HEADER BLOCK */}
          <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PUBLIC REPLAY DIRECTORY</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
                  COMMUNITY RECORDINGS
                </h1>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search title, tool, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-zinc-800 pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition font-mono"
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

            {/* TELEMETRY METRIC STATS */}
            {!loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-black border border-zinc-900 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase block mb-1">PUBLIC RECORDINGS</span>
                  <strong className="text-white font-bold text-base tabular-nums">{sessions.length}</strong>
                </div>

                <div className="bg-black border border-zinc-900 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase block mb-1">FILTERED MATCHES</span>
                  <strong className="text-white font-bold text-base tabular-nums">{filteredSessions.length}</strong>
                </div>

                <div className="bg-black border border-zinc-900 p-3 col-span-2 sm:col-span-1">
                  <span className="text-zinc-500 text-[10px] uppercase block mb-1">DIRECTORY INDEX</span>
                  <strong className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                    LIVE
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
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">LOADING COMMUNITY RECORDINGS...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredSessions.length === 0 && (
            <div className="p-10 text-center bg-zinc-950 border border-zinc-800 space-y-3 max-w-lg mx-auto">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">NO RECORDINGS FOUND</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                No session matches your search filter. Try clearing active filters or searching another query.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="px-3 py-1.5 bg-white text-black text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
              >
                RESET FILTERS
              </button>
            </div>
          )}

          {/* SESSIONS GRID */}
          {!loading && filteredSessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  {/* PREVIEW CONTAINER */}
                  <div className="h-52 bg-black relative border-b border-zinc-900 overflow-hidden group">
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
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">
                      {session.title || "UNTITLED SESSION"}
                    </h3>

                    {/* TAGS LIST */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] min-h-[22px]">
                      {session.tags && session.tags.length > 0 ? (
                        session.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))
                      ) : (
                        <span className="text-zinc-600 text-[10px]">#terminal</span>
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

        </main>
      </div>

      {/* EMBED MODAL */}
      {embedModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md p-6 space-y-5 shadow-2xl relative font-mono">
            
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
              <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 text-xs text-white">
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

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
