"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import BgImage from "../../../public/Artz Now _ 1910437696159313939 (2).jpeg";
import TerminalImage from "../../../public/terminal.png";

import Player from "@/components/Player";
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
      className="group flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition duration-200 hover:border-white/20"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.5)",
      }}
    >
      <span className="text-white/30">$</span>
      <span>{command}</span>
      {copied ? (
        <Check size={11} className="text-emerald-400" />
      ) : (
        <Copy size={11} className="opacity-40 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export default function Hero() {
  const [demoContent, setDemoContent] = useState<string | null>(null);
  const {isAuthenticated, user} = useAuth();

  useEffect(() => {
    fetch("/test.replay")
      .then((res) => res.text())
      .then(setDemoContent)
      .catch(() => {});
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-[#050505]">
      {/* Background Layer with Precise Vignette Gradients */}
     {/* Background Layer (Premium Vercel-style depth system) */}
{/* Background Layer (clean + visible + cinematic) */}
<div className="absolute inset-0">
  <Image
    src={BgImage}
    alt="Background"
    fill
    priority
    quality={100}
    className="object-cover scale-105 opacity-50"
  />

  {/* soft dark base */}
  <div className="absolute inset-0 bg-black/50" />

  {/* vignette only (this is what makes it premium) */}
  <div className="absolute inset-0 bg-radial-gradient-[ellipse_at_center] from-transparent via-black/20 to-black" />

  {/* subtle glow (optional but nice) */}
  <div className="absolute right-0 top-1/2 h-175 w-175 -translate-y-1/2 bg-blue-500/10 blur-[140px]" />
</div>

      {/* Main Container Layout */}
      <div className="mx-auto max-w-[90%] w-full grid grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-[500px_2fr]">
        
        {/* LEFT SIDE: Minimalist Engineered Typography */}
        <div className="flex flex-col gap-5 text-left z-10">
          {/* Micro Badge */}
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/5 bg-white/3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-neutral-400">
            {/* <Terminal size={12} className="text-neutral-500" /> */}
           {isAuthenticated ? `✦ WELCOME BACK ${user?.name.split(" ")[0]} ✦` : "✦ NOW LIVE ✦"}
          </div>

          {/* Compressed, High-Impact Heading */}
          <h1 className="md:text-6xl font-bold tracking-tight text-white text-4xl leading-[1.15]">
          {isAuthenticated?"Ready to stream your next session?":" Kill the static logs. Stream your terminal instantly."}
          </h1>

          {/* Concise Subtext */}
        {!isAuthenticated?  <p className="max-w-sm text-sm leading-relaxed text-neutral-400">
           Capture interactive terminal sessions as lightweight event streams. Share perfect replays with a single command.
          </p> : 
          <p>
            Your CLI is authenticated and ready. Run the record command below to instantly capture and share your terminal events.
          </p>
          }
        

          {/* Clean Action Anchors */}
       <div className="flex items-center gap-5 pt-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition-all shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>

      <div className="relative w-full flex justify-center lg:justify-end items-center">
  
  {/* glow backplate */}
  <div className="absolute w-[90%] h-[85%] bg-blue-500/10 rounded-[30px] blur-[120px]" />

  {/* perspective wrapper */}
  <div
    className="w-full max-w-3xl aspect-16/10 rounded-2xl transition-transform duration-700"
    style={{
      perspective: "1400px",
      transformStyle: "preserve-3d",
    }}
  >
    {/* TERMINAL (BIGGER + MORE IMMERSIVE) */}
    <div
      className="w-full h-full rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-md overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] flex flex-col"
      style={{
        transform: "rotateX(14deg) rotateY(-20deg) rotateZ(6deg)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* header */}
      <div className="h-10 w-full bg-neutral-900/60 border-b border-white/6 flex items-center px-4 gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />

        <span className="mx-auto text-[11px] text-neutral-500 font-mono">
          demo.replay
        </span>
      </div>

      {/* content */}
      <div className="flex-1 bg-black/40">
        {demoContent ? (
          // <Player/>
          <Image
            src={TerminalImage}
            alt="Terminal"
            width={800}
            height={400}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
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