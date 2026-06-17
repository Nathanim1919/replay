"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Player from "@/components/Player";
import BackgroundImage from "../../../../public/terminalBg.jpeg";
import { ChevronLeft, PanelRight, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import SearchContent from "@/components/Search";
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
  
  // State to manage sidebar open/close visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      await navigator.clipboard.writeText(url)
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
        <div className={`z-10 flex h-screen w-screen transition-all duration-300 ${isSidebarOpen ? "pr-[30%]" : "pr-0"}`}>
          
          {/* Centered Player Box Wrapper */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <div className="z-20 bg-zinc-900/80 backdrop-blur border-b border-l border-zinc-800 absolute top-0 left-0 flex items-center gap-3 p-2.5 rounded-br-2xl text-zinc-400">
            <ChevronLeft
                size={20}
                onClick={() => window.history.back()}
                className={`cursor-pointer transition-colors ${isSidebarOpen ? "text-white" : "hover:text-white"}`}
              />
            
            </div>
            
            {/* Context Floating Action Bar */}
           {!isSidebarOpen && <div className="z-20 bg-zinc-900/80 backdrop-blur border-b border-l border-zinc-800 absolute top-0 right-0 flex items-center gap-3 p-2.5 rounded-bl-2xl text-zinc-400">
              <Search
                size={18}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`cursor-pointer transition-colors ${isSidebarOpen ? "text-white" : "hover:text-white"}`}
              />
              <Share2
                onClick={handleShare}
                size={18}
                className="hover:text-white cursor-pointer transition-colors"
              />
            </div>
}
            {/* Terminal Window Frame */}
            <div className="w-full max-w-4xl aspect-square overflow-hidden grid place-items-center">
              <Player />
            </div>
          </div>
        </div>

        {/* Professional Slide-Out Right Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen w-[30%] bg-[#121111] border-l border-zinc-900 backdrop-blur-md z-30 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar Top Header Row */}
          <div className="w-full bg-black p-3 flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-bold tracking-wider uppercase">Session Index</span>
            <PanelRight 
              size={18} 
              onClick={() => setIsSidebarOpen(false)}
              className="cursor-pointer hover:text-white transition-colors"
            />
          </div>
          
          {/* Scrollable Results Content Box */}
          <div className="flex-1 overflow-y-auto p-4">
            <SearchContent />
          </div>
        </div>
      </PlayerProvider>
    </PageLayout>
  );
}