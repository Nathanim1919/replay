"use client";

import { useState } from "react";
import {
  Terminal,
  Play,
  FastForward,
  Code2,
  Check,
  Copy,
  Search,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  stats: { label: string; value: string };
  codeSnippet: string;
}

const products: Product[] = [
  {
    id: "terminal-engine",
    name: "Terminal Engine",
    badge: "Go Core PTY",
    tagline: "Low-overhead PTY recording binary with real-time DLP secret scrubbing",
    description:
      "A high-performance Go CLI binary interfacing directly with system pseudo-terminals (/dev/pty). Captures ANSI color streams, timing offsets, and window resize signals with microsecond timing.",
    icon: Terminal,
    stats: { label: "Overhead", value: "< 2MB" },
    highlights: [
      "Zero CPU overhead with native Go syscall hooks",
      "Automatic DLP secret redaction before write",
      "Stream compression with instant serialization",
      "Dynamic PTY window resize event synchronization",
    ],
    codeSnippet: `$ replay record --output session.replay
[replay] Hooked to /dev/pts/3
[replay] Secret Scrub: 2 tokens masked
[replay] Session saved successfully.`,
  },
  {
    id: "web-player",
    name: "Web Player",
    badge: "Canvas Renderer",
    tagline: "High-FPS xterm.js playback with instant frame scrubbing",
    description:
      "A pixel-perfect browser player designed for technical sessions. Reconstructs terminal states instantly at any timestamp with zero buffer lag, activity waveforms, and variable speed control up to 8x.",
    icon: Play,
    stats: { label: "Frame Rate", value: "60 FPS" },
    highlights: [
      "Instant seeking without full re-execution",
      "Visual activity waveform for quick navigation",
      "Searchable command history with jump-to-timestamp",
      "Custom themes & font scaling support",
    ],
    codeSnippet: `import { Player } from '@replay/web';

<Player 
  src='/api/recordings/demo'
  autoPlay
  speed={2}
/>`,
  },
  {
    id: "instant-seeking",
    name: "Instant Seeking",
    badge: "Fast Indexing",
    tagline: "Zero-latency timeline scrubbing across long recordings",
    description:
      "Indexes ANSI terminal streams into keyframes. Jump instantly to any frame, error output, or command invocation without waiting for linear playback computation.",
    icon: Search,
    stats: { label: "Seek Latency", value: "< 5ms" },
    highlights: [
      "Keyframe snapshot indexing engine",
      "Jump directly to error stack traces",
      "Full ANSI color buffer preservation",
      "Non-blocking background parser thread",
    ],
    codeSnippet: `const player = new ReplayPlayer('session_8921');
await player.seekTo('02:45.12');
console.log(player.getCurrentCommand());`,
  },
  {
    id: "skip-idle",
    name: "Skip-Idle Playback",
    badge: "Smart Timeline",
    tagline: "Automatic silence scrubbing to skip long inactive waiting gaps",
    description:
      "Eliminate tedious waiting during long builds or idle terminal pauses. Skip-Idle automatically detects gaps where no terminal output was emitted and fast-forwards smoothly.",
    icon: FastForward,
    stats: { label: "Time Saved", value: "Up to 80%" },
    highlights: [
      "Dynamic silence detection thresholding",
      "Smooth velocity boost during inactive gaps",
      "Preserves realistic visual timing for typing",
      "Toggleable on-the-fly in the player UI",
    ],
    codeSnippet: `⏩ [Skip-Idle] Gap detected (18.4s)
⏩ Scrubbing silence forward @ 10x speed...
✅ Resumed normal playback at 01:42`,
  },
  {
    id: "embeddable-player",
    name: "Embeddable Player",
    badge: "API & IFrame",
    tagline: "Drop-in interactive replays for documentation, PRs, and blogs",
    description:
      "Embed interactive terminal replays into technical blogs, GitHub documentation, and pull requests. Includes a dedicated iframe route (/embed/:id) with responsive resizing.",
    icon: Code2,
    stats: { label: "Bundle Size", value: "~14KB" },
    highlights: [
      "Lightweight iframe route without full site overhead",
      "Responsive container fitting any documentation layout",
      "Direct deep-link timestamps for specific commands",
      "One-click embed code generator",
    ],
    codeSnippet: `<iframe
  src="https://replay.nathanim.dev/embed/sess_9281"
  width="100%"
  height="400"
  frameborder="0"
/>`,
  },
];

export default function ProductShowcase() {
  const [activeId, setActiveId] = useState(products[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === activeId) || products[0];

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      id="products-suite"
      className="mx-auto bg-gray-100 border-t border-gray-300 relative py-16"
      style={{ scrollMarginTop: "90px" }}
    >
      <div className="w-[95%] md:w-[80%] mx-auto space-y-10">
        
        {/* HEADER MATCHING HERO / FEATURES STYLE */}
        <div className="grid place-items-center text-center space-y-3">
          <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-black">
            Platform features
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl text-center">
            Explore the core components designed to record, stream, and render your terminal sessions.
          </p>
        </div>

        {/* INTERACTIVE TABS BAR */}
        <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {products.map((product) => {
            const Icon = product.icon;
            const isActive = activeId === product.id;
            return (
              <button
                key={product.id}
                onClick={() => setActiveId(product.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold tracking-tight transition cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-gray-700 hover:text-black border-gray-300 hover:border-gray-400"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                <span>{product.name}</span>
              </button>
            );
          })}
        </div>

        {/* PRODUCT DISPLAY CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 sm:p-10 bg-white border border-gray-300 rounded-2xl shadow-sm">
          
          {/* LEFT DETAILS */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-gray-100 border border-gray-300 font-mono text-xs font-bold text-black">
                  {activeProduct.badge}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {activeProduct.stats.label}: <strong className="text-black">{activeProduct.stats.value}</strong>
                </span>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold tracking-tight text-black">
                  {activeProduct.name}
                </h3>
                <p className="text-sm font-mono text-gray-600 mt-1">
                  {activeProduct.tagline}
                </p>
              </div>

              <p className="text-base text-gray-700 leading-relaxed max-w-xl">
                {activeProduct.description}
              </p>
            </div>

            {/* HIGHLIGHTS */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-extrabold tracking-tight uppercase text-gray-500">
                Key Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeProduct.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800"
                  >
                    <Check className="w-4 h-4 text-black shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="font-semibold leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT CODE PREVIEW PANEL */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-neutral-950 border border-neutral-800 p-6 space-y-4 shadow-sm text-white font-mono">
            
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="text-[11px] text-neutral-400 font-mono ml-1">
                  {activeProduct.id}.sh
                </span>
              </div>

              <button
                onClick={() => handleCopy(activeProduct.codeSnippet, activeProduct.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-[11px] text-neutral-300 hover:text-white transition cursor-pointer"
              >
                {copiedId === activeProduct.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="py-2 text-xs text-neutral-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              <code>{activeProduct.codeSnippet}</code>
            </pre>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Production Ready</span>
              </div>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 font-bold text-white hover:text-neutral-300 transition"
              >
                <span>How it works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
