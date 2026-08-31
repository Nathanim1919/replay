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
    name: "TERMINAL ENGINE",
    badge: "GO CORE PTY",
    tagline: "Low-overhead PTY recording binary with real-time DLP secret scrubbing",
    description:
      "A high-performance Go CLI binary interfacing directly with system pseudo-terminals (/dev/pty). Captures ANSI color streams, timing offsets, and window resize signals with microsecond timing.",
    icon: Terminal,
    stats: { label: "OVERHEAD", value: "< 2MB" },
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
    name: "WEB PLAYER",
    badge: "CANVAS RENDERER",
    tagline: "High-FPS xterm.js playback with instant frame scrubbing",
    description:
      "A browser player designed for technical terminal sessions. Reconstructs terminal states instantly at any timestamp with zero buffer lag, activity waveforms, and speed control.",
    icon: Play,
    stats: { label: "FRAME RATE", value: "60 FPS" },
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
    name: "INSTANT SEEKING",
    badge: "INDEXING ENGINE",
    tagline: "Zero-latency timeline scrubbing across long recordings",
    description:
      "Indexes ANSI terminal streams into keyframes. Jump instantly to any frame, error output, or command invocation without waiting for linear playback computation.",
    icon: Search,
    stats: { label: "SEEK LATENCY", value: "< 5ms" },
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
    name: "SKIP-IDLE PLAYBACK",
    badge: "SMART TIMELINE",
    tagline: "Automatic silence scrubbing to skip long inactive waiting gaps",
    description:
      "Eliminate tedious waiting during long builds or idle terminal pauses. Skip-Idle automatically detects gaps where no terminal output was emitted and fast-forwards smoothly.",
    icon: FastForward,
    stats: { label: "TIME SAVED", value: "UP TO 80%" },
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
    name: "EMBEDDABLE PLAYER",
    badge: "API & IFRAME",
    tagline: "Drop-in interactive replays for documentation, PRs, and blogs",
    description:
      "Embed interactive terminal replays into technical blogs, GitHub documentation, and pull requests. Includes a dedicated iframe route (/embed/:id) with responsive resizing.",
    icon: Code2,
    stats: { label: "BUNDLE SIZE", value: "~14KB" },
    highlights: [
      "Lightweight iframe route without site overhead",
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
    <section
      id="products-suite"
      className="bg-black text-white border-t border-zinc-800 py-16 font-mono selection:bg-emerald-500 selection:text-black"
      style={{ scrollMarginTop: "90px" }}
    >
      <div className="w-[95%] md:w-[85%] max-w-6xl mx-auto space-y-8">
        
        {/* HEADER BLOCK */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Terminal className="w-3.5 h-3.5" />
            <span>ARCHITECTURE SPECIFICATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            PLATFORM FEATURES
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            Core execution primitives for high-performance terminal session capture and playback.
          </p>
        </div>

        {/* TABS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {products.map((product) => {
            const Icon = product.icon;
            const isActive = activeId === product.id;
            return (
              <button
                key={product.id}
                onClick={() => setActiveId(product.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-white text-black border-white"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-emerald-400"}`} />
                <span>{product.name}</span>
              </button>
            );
          })}
        </div>

        {/* PRODUCT DISPLAY CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 bg-zinc-950 border border-zinc-800">
          
          {/* LEFT DETAILS */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-black border border-zinc-800 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                  {activeProduct.badge}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {activeProduct.stats.label}: <strong className="text-white tabular-nums">{activeProduct.stats.value}</strong>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-white uppercase">
                  {activeProduct.name}
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  {activeProduct.tagline}
                </p>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                {activeProduct.description}
              </p>
            </div>

            {/* HIGHLIGHTS */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                CAPABILITIES
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeProduct.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 bg-black border border-zinc-900 text-xs text-zinc-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT CODE PREVIEW PANEL */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-black border border-zinc-900 p-5 space-y-4 font-mono">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-zinc-700" />
                <span className="w-2 h-2 bg-zinc-700" />
                <span className="w-2 h-2 bg-zinc-700" />
                <span className="text-[10px] text-zinc-400 font-mono ml-1">
                  {activeProduct.id}.sh
                </span>
              </div>

              <button
                onClick={() => handleCopy(activeProduct.codeSnippet, activeProduct.id)}
                className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition cursor-pointer"
              >
                {copiedId === activeProduct.id ? (
                  <span className="text-emerald-400 font-bold">COPIED</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-500" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            <pre className="py-2 text-[11px] text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              <code>{activeProduct.codeSnippet}</code>
            </pre>

            <div className="pt-2.5 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>PRODUCTION READY</span>
              </div>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 font-bold text-white hover:text-emerald-400 transition"
              >
                <span>HOW IT WORKS</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
