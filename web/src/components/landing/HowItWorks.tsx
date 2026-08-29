"use client";

import { useState, useEffect } from "react";
import {
  Terminal,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  GitFork,
  Cpu,
  ArrowRight,
  Play,
  Zap,
  Disc3,
  Share2,
} from "lucide-react";

type CodeTab = {
  id: string;
  label: string;
  step: string;
  icon: any;
  command: string;
  description: string;
  outputLines: { text: string; color?: string; delay?: number }[];
};

const CODE_TABS: CodeTab[] = [
  {
    id: "install",
    label: "1. Install CLI",
    step: "STEP 01",
    icon: Terminal,
    command: "curl -fsSL https://raw.githubusercontent.com/Nathanim1919/replay/trunk/install.sh | bash",
    description: "One-line installation script auto-detects your OS and installs the global executable.",
    outputLines: [
      { text: "🚀 Downloading Replay CLI binary for linux/amd64...", color: "text-blue-400" },
      { text: "📦 Unpacking binary target to /usr/local/bin/replay...", color: "text-slate-400" },
      { text: "✅ Replay CLI v1.0.0 installed successfully!", color: "text-emerald-400 font-bold" },
      { text: "💡 Next step: Run 'replay login' to connect your terminal account.", color: "text-amber-300" },
    ],
  },
  {
    id: "record",
    label: "2. Record & Stream",
    step: "STEP 02",
    icon: Disc3,
    command: "replay record session.replay",
    description: "Captures microsecond-timestamped terminal events with real-time DLP credential scrubbing.",
    outputLines: [
      { text: "🔴 Recording active terminal session to session.replay...", color: "text-rose-400 font-semibold" },
      { text: "🛡️ DLP Redactor: Active (1 secret auto-redacted: AWS_ACCESS_KEY)", color: "text-purple-400" },
      { text: "💾 Session saved locally (42.8 KB Zstd compressed)", color: "text-slate-400" },
      { text: "☁️ Uploading stream to cloud...", color: "text-blue-400" },
      { text: "🔗 Shareable Replay Link: https://replay.space/s/x8f2k9", color: "text-emerald-400 font-mono font-bold" },
    ],
  },
  {
    id: "fork",
    label: "3. Time-Travel Fork",
    step: "STEP 03",
    icon: GitFork,
    command: "replay fork session.replay 14.5",
    description: "Launch an interactive subshell restored precisely at the 14.5s mark with original CWD state.",
    outputLines: [
      { text: "🔍 Reading checkpoint snapshot at T=14.5s...", color: "text-cyan-400" },
      { text: "📁 Restoring Working Directory: ~/company/replay/web", color: "text-slate-300" },
      { text: "🚀 Interactive forked subshell spawned successfully (PID: 14829)", color: "text-emerald-400 font-semibold" },
      { text: "nathanim@replay:~/company/replay/web (forked)$", color: "text-purple-300 font-mono font-bold" },
    ],
  },
];

export default function HowItWorks() {
  const [activeTabId, setActiveTabId] = useState<string>("install");
  const [copied, setCopied] = useState<boolean>(false);
  const [visibleLineCount, setVisibleLineCount] = useState<number>(0);

  const activeTab = CODE_TABS.find((t) => t.id === activeTabId) || CODE_TABS[0];

  useEffect(() => {
    setVisibleLineCount(0);
    const interval = setInterval(() => {
      setVisibleLineCount((prev) => {
        if (prev < activeTab.outputLines.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [activeTabId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="how-it-works"
      className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3.5 h-3.5" />
            Apple-Grade Developer Workflow
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 leading-tight">
            How Replay Works. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
              Three Commands. Zero Config.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 font-medium leading-relaxed">
            Record microsecond terminal sessions, auto-scrub credentials, and stream live interactive replays directly to your team.
          </p>
        </div>

        {/* Tab Selection Header */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {CODE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]"
                    : "bg-slate-900/80 hover:bg-slate-800/80 text-slate-400 hover:text-white border border-slate-800/80 backdrop-blur-md"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* macOS Window Terminal Display Container */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-2xl overflow-hidden mb-16 ring-1 ring-white/10">
          {/* macOS Titlebar */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/80">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm" />
              <span className="ml-3 text-xs font-mono text-slate-400 font-medium hidden sm:inline">
                replay-terminal — zsh (80x24)
              </span>
            </div>

            {/* Active Telemetry Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-[11px] font-mono text-cyan-400">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>PID: 84920</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">CWD: ~/company/replay</span>
              </div>
            </div>
          </div>

          {/* Command Code Bar */}
          <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto font-mono text-sm sm:text-base">
              <span className="text-emerald-400 font-bold select-none">$</span>
              <span className="text-white font-medium break-all">{activeTab.command}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shrink-0 self-end sm:self-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>

          {/* Simulated Live Output Display */}
          <div className="p-6 font-mono text-xs sm:text-sm min-h-[220px] bg-slate-950/70 space-y-2.5">
            <div className="text-slate-500 text-xs mb-3 font-sans flex items-center gap-2">
              <Play className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>Live Command Terminal Stream</span>
            </div>

            {activeTab.outputLines.slice(0, visibleLineCount).map((line, idx) => (
              <div key={idx} className={`leading-relaxed ${line.color || "text-slate-300"} transition-all duration-300`}>
                {line.text}
              </div>
            ))}

            {visibleLineCount < activeTab.outputLines.length && (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs pt-1">
                <span className="w-2 h-4 bg-cyan-400 animate-pulse inline-block" />
                <span>executing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Apple Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
              Zero Config PTY Engine
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Spawns native subshell PTY forwarders to record stdout, stdin, ANSI escape sequences, and OS process metrics with sub-millisecond accuracy.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
              Real-Time DLP Secret Redactor
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Intercepts and redacts sensitive credentials, JWT bearer tokens, database passwords, and AWS access keys before sending streams to cloud.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <GitFork className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
              Time-Travel Shell Forking
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              <code className="text-cyan-300 font-mono text-xs font-semibold">replay fork [file] [timestamp]</code> reconstitutes terminal state snapshots so you can jump directly into recorded session subshells instantly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
