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
  <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black font-mono selection:bg-emerald-500 selection:text-black">
    {/* Background Image with Pitch Black Overlay */}
    <Image
      src={BackgroundImage}
      alt="Background"
      fill
      priority
      placeholder="blur"
      className="object-cover opacity-20 grayscale"
    />
    <div className="absolute inset-0 bg-black/80" />
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
      toast.success("Session URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  if (error) {
    return (
      <PageLayout>
        <div className="z-10 bg-zinc-950 border border-red-500/50 text-red-400 px-6 py-4 font-mono text-xs uppercase tracking-wider">
          ERROR: {error}
        </div>
      </PageLayout>
    );
  }

  if (!content) {
    return (
      <PageLayout>
        <div className="z-10 bg-zinc-950 border border-zinc-800 text-zinc-400 px-6 py-4 font-mono text-xs uppercase tracking-widest flex items-center gap-3">
          <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
          <span>LOADING SESSION STREAM...</span>
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
            
            {/* Top Left Navigation Bar */}
            <div className="z-20 bg-zinc-950/90 border border-zinc-800 absolute top-4 left-4 flex items-center gap-3 p-2 text-zinc-400 font-mono text-xs">
              <ChevronLeft
                size={18}
                onClick={() => window.history.back()}
                className="cursor-pointer text-zinc-400 hover:text-white transition-colors"
              />
              <span className="text-[11px] font-bold text-white border-l border-zinc-800 pl-2.5 uppercase tracking-wider">
                REPLAY PLAYER
              </span>
            </div>
            
            {/* Context Floating Action Bar */}
            {!isSidebarOpen && (
              <div className="z-20 bg-zinc-950/90 border border-zinc-800 absolute top-4 right-4 flex items-center gap-2 p-1.5 text-zinc-400 font-mono text-xs">
                <button
                  onClick={() => {
                    setActiveTab("ai");
                    setIsSidebarOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer"
                >
                  <Sparkles size={13} className="text-black" />
                  <span>AI COPILOT</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("search");
                    setIsSidebarOpen(true);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                  title="Search Recording"
                >
                  <Search size={16} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                  title="Share Recording"
                >
                  <Share2 size={16} />
                </button>
              </div>
            )}

            {/* Terminal Window Frame */}
            <div className="w-full max-w-4xl aspect-square overflow-hidden grid place-items-center">
              <Player />
            </div>
          </div>
        </div>

        {/* Slide-Out Right Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-black border-l border-zinc-800 z-30 flex flex-col transition-transform duration-300 ease-in-out font-mono ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar Top Header Row with Tabs */}
          <div className="w-full bg-zinc-950 px-4 py-3 flex items-center justify-between border-b border-zinc-800 text-xs shrink-0">
            <div className="flex gap-2 bg-black p-1 border border-zinc-800">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 py-1 font-bold text-xs uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "search" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Search size={13} /> SEARCH
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1 font-bold text-xs uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-emerald-400 text-black font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles size={13} /> AI COPILOT
              </button>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <PanelRight size={16} />
            </button>
          </div>
          
          {/* Scrollable Results Content Box */}
          <div className="flex-1 overflow-y-auto bg-zinc-950">
            {activeTab === "search" ? <SearchContent /> : <AICopilot />}
          </div>
        </div>
      </PlayerProvider>
    </PageLayout>
  );
}