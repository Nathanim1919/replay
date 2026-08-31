"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Terminal, ArrowRight } from "lucide-react";
import BgImage from "../../../public/Artz Now _ 1910437696159313939 (2).jpeg";
import TerminalImage from "../../../public/terminal.png";
import { useAuth } from "@/context/AuthContext";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [command]);

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 transition duration-200 hover:border-zinc-700 hover:text-white cursor-pointer"
    >
      <span className="text-emerald-400 font-bold">$</span>
      <span>{command}</span>
      {copied ? (
        <Check size={12} className="text-emerald-400 font-bold" />
      ) : (
        <Copy size={12} className="text-zinc-500 group-hover:text-white transition-colors" />
      )}
    </button>
  );
}

export default function Hero() {
  const [demoContent, setDemoContent] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetch("/test.replay")
      .then((res) => res.text())
      .then(setDemoContent)
      .catch(() => {});
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-black font-mono selection:bg-emerald-500 selection:text-black">
      {/* Background Layer with Precise Vignette Gradients */}
      <div className="absolute inset-0">
        <Image
          src={BgImage}
          alt="Background"
          fill
          priority
          quality={100}
          className="object-cover scale-105 opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-radial-gradient-[ellipse_at_center] from-transparent via-black/40 to-black" />
        <div className="absolute right-0 top-1/2 h-175 w-175 -translate-y-1/2 bg-emerald-500/5 blur-[140px]" />
      </div>

      {/* Main Container Layout */}
      <div className="mx-auto max-w-6xl w-[95%] grid grid-cols-1 items-center gap-12 px-4 sm:px-6 py-16 lg:grid-cols-[520px_1fr] relative z-10">
        
        {/* LEFT SIDE: Industrial Engineered Typography */}
        <div className="flex flex-col gap-5 text-left">
          
          {/* Micro Badge */}
          <div className="inline-flex w-fit items-center gap-2 border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
            {isAuthenticated
              ? `STATUS: AUTHENTICATED [${user?.name?.split(" ")[0]?.toUpperCase() || "USER"}]`
              : "TERMINAL ENGINE V1.0.0"}
          </div>

          {/* Compressed, High-Impact Heading */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase leading-[1.1]">
            {isAuthenticated
              ? "TERMINAL ENGINE ACTIVE"
              : "RECORD YOUR TERMINAL. REPLAY IN BROWSER."}
          </h1>

          {/* Concise Subtext */}
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-400 max-w-md">
            {isAuthenticated
              ? "Your CLI engine is linked. Execute $ replay record to record and stream session events to your repository."
              : "Microsecond PTY capture with real-time secret scrubbing, timeline seeking, AI analysis, and live shell forking."}
          </p>

          {/* Clean Action Anchors */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={isAuthenticated ? "#recordings" : "/signup"}
              className="px-4 py-2 bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer flex items-center gap-1.5 border border-white"
            >
              <span>{isAuthenticated ? "VIEW DASHBOARD" : "GET STARTED FREE"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <CopyCommand command="replay record" />
          </div>
        </div>

        {/* RIGHT SIDE: 3D Perspective Terminal Frame */}
        <div className="relative w-full flex justify-center lg:justify-end items-center">
          <div className="w-full max-w-2xl aspect-16/10 rounded-none transition-transform duration-700">
            <div className="w-full h-full border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="h-9 w-full bg-black border-b border-zinc-900 flex items-center justify-between px-3 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-zinc-700" />
                  <span className="w-2.5 h-2.5 bg-zinc-700" />
                  <span className="w-2.5 h-2.5 bg-zinc-700" />
                  <span className="ml-2 font-mono text-[11px] text-zinc-300">
                    demo.replay
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <Terminal size={12} />
                  <span>PTY 80x24</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 bg-black relative">
                {demoContent ? (
                  <Image
                    src={TerminalImage}
                    alt="Terminal Preview"
                    width={800}
                    height={400}
                    className="w-full h-full object-cover opacity-85"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600 text-xs font-mono">
                    LOADING STREAM...
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}