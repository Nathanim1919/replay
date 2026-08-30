"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Player from "@/components/Player";
import BackgroundImage from "../../../../public/terminalBg.jpeg";
import { ChevronLeft, PanelRight, Search, Share2, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";
import SearchContent from "@/components/Search";
import AICopilot from "@/components/AICopilot";
import { PlayerProvider } from "@/hooks/usePlayer";

// PageLayout wrapper component
const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
    {/* Background Image */}
    <Image
      src={BackgroundImage}
      alt="Background"
      fill
      priority
      placeholder="blur"
      className="object-cover brightness-50"
    />
    {children}
  </div>
);

export default function SessionPage() {
  const { shortcode } = useParams<{ shortcode: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State to manage sidebar open/close visibility & active tab
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "ai">("search");

  useEffect(() => {
    if (!shortcode) return;

    fetch(`/api/recordings/${shortcode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found");
        return res.text();
      })
      .then(setContent)
      .catch((err) => setError(err.message));
  }, [shortcode]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    try {
      const url = `${window.location.origin}/s/${shortcode}`;
      await navigator.clipboard.writeText(url);
      toast.success("Session URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL. Please try again.");
    }
  };

  if (error) {
    return (
      <PageLayout>
        <div className="z-10 bg-black/80 backdrop-blur-md border border-red-500/30 text-red-400 px-6 py-4 rounded-lg shadow-2xl font-mono">
          {error}
        </div>
      </PageLayout>
    );
  }

  if (!content) {
    return (
      <PageLayout>
        <div className="z-10 bg-black/60 backdrop-blur-md text-zinc-400 px-6 py-4 rounded-lg shadow-xl font-mono flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          Loading session...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PlayerProvider content={content}>
        {/* Dynamic Main Workspace Container */}
        <div className={`z-10 flex h-screen w-screen transition-all duration-300 ${isSidebarOpen ? "pr-0 md:pr-[420px]" : "pr-0"}`}>
          
          {/* Centered Player Box Wrapper */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <div className="z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800 absolute top-4 left-4 flex items-center gap-3 p-2.5 rounded-2xl text-slate-400 shadow-xl">
              <ChevronLeft
                size={20}
                onClick={() => window.history.back()}
                className="cursor-pointer text-slate-300 hover:text-white transition-colors"
              />
              <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-2.5 font-bold">
                Replay Player
              </span>
            </div>
            
            {/* Context Floating Action Bar */}
            {!isSidebarOpen && (
              <div className="z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800 absolute top-4 right-4 flex items-center gap-2 p-2 rounded-2xl text-slate-400 shadow-xl">
                <button
                  onClick={() => {
                    setActiveTab("ai");
                    setIsSidebarOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 transition cursor-pointer"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  <span>AI Copilot</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("search");
                    setIsSidebarOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Search Recording"
                >
                  <Search size={18} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Share Recording"
                >
                  <Share2 size={18} />
                </button>
              </div>
            )}

            {/* Terminal Window Frame */}
            <div className="w-full max-w-4xl aspect-square overflow-hidden grid place-items-center">
              <Player />
            </div>
          </div>
        </div>

        {/* Professional Slide-Out Right Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-2xl z-30 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar Top Header Row with Tabs */}
          <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800/80 text-slate-400 font-sans text-xs shrink-0">
            <div className="flex gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "search" ? "bg-slate-800 text-white shadow-xs" : "hover:text-slate-200"
                }`}
              >
                <Search size={14} /> Search
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "hover:text-slate-200"
                }`}
              >
                <Sparkles size={14} /> AI Copilot
              </button>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <PanelRight size={18} />
            </button>
          </div>
          
          {/* Scrollable Results Content Box */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "search" ? <SearchContent /> : <AICopilot />}
          </div>
        </div>
      </PlayerProvider>
    </PageLayout>
  );
}