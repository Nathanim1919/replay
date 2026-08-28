"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Player from "@/components/Player";
import { PlayerProvider } from "@/hooks/usePlayer";
import { ExternalLink, Terminal } from "lucide-react";

export default function EmbedPage() {
  const { shortcode } = useParams<{ shortcode: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg font-mono text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="w-screen h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-zinc-500 font-mono text-xs flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading terminal replay...
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#09090b] flex flex-col p-2 overflow-hidden relative group">
      <PlayerProvider content={content}>
        <div className="w-full h-full flex flex-col relative">
          <Player mode="full" title={`replay: ${shortcode}`} />
          
          {/* Subtle Powered by Replay Overlay Badge */}
          <div className="absolute top-2 right-2.5 z-30 opacity-60 hover:opacity-100 transition-opacity">
            <a
              href={`/s/${shortcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-400 hover:text-orange-400 transition-colors shadow-sm"
              title="Open full session player in new tab"
            >
              <Terminal size={12} className="text-orange-500" />
              <span>Open in Replay</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </PlayerProvider>
    </div>
  );
}
