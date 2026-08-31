"use client";

import { useState, useEffect } from "react";
import {
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  GitFork,
  Disc3,
} from "lucide-react";

type CodeTab = {
  id: string;
  label: string;
  step: string;
  icon: any;
  command: string;
  description: string;
  outputLines: { text: string; color?: string }[];
};

const CODE_TABS: CodeTab[] = [
  {
    id: "install",
    label: "INSTALLATION",
    step: "01",
    icon: Terminal,
    command: "curl -fsSL https://raw.githubusercontent.com/Nathanim1919/replay/trunk/install.sh | bash",
    description: "Downloads and verifies the global replay executable to /usr/local/bin.",
    outputLines: [
      { text: "DOWNLOADING REPLAY CLI BINARY...", color: "text-zinc-400" },
      { text: "UNPACKING TARGET TO /usr/local/bin/replay...", color: "text-zinc-500" },
      { text: "VERIFYING CHECKSUM SHA256... OK", color: "text-emerald-400 font-bold" },
      { text: "REPLAY CLI V1.0.0 INSTALLED SUCCESSFULLY.", color: "text-emerald-400" },
    ],
  },
  {
    id: "record",
    label: "SESSION RECORDING",
    step: "02",
    icon: Disc3,
    command: "replay record session.replay",
    description: "Captures terminal stdout, stdin, ANSI escape sequences, and process state.",
    outputLines: [
      { text: "RECORDING ACTIVE TERMINAL SESSION TO session.replay...", color: "text-amber-400 font-bold" },
      { text: "DLP REDACTOR: ACTIVE (CREDENTIAL PATTERNS SCRUBBED)", color: "text-zinc-400" },
      { text: "SAVED LOCAL STREAM (ZSTD COMPRESSED)", color: "text-zinc-500" },
      { text: "UPLOADING STREAM TO CLOUD ENGINE...", color: "text-emerald-400" },
      { text: "SHARE LINK GENERATED: http://localhost:3000/s/x8f2k9", color: "text-emerald-400 font-bold" },
    ],
  },
  {
    id: "fork",
    label: "TIME-TRAVEL FORK",
    step: "03",
    icon: GitFork,
    command: "replay fork session.replay 14.5",
    description: "Restores terminal snapshot state at T=14.5s into an interactive subshell.",
    outputLines: [
      { text: "READING CHECKPOINT SNAPSHOT AT T=14.5s...", color: "text-zinc-400" },
      { text: "RESTORING WORKING DIRECTORY: ~/company/replay/web", color: "text-zinc-300" },
      { text: "SPAWNING INTERACTIVE FORKED SUBSHELL (PID: 14829)...", color: "text-emerald-400" },
      { text: "nathanim@replay:~/company/replay/web (forked)$", color: "text-emerald-400 font-bold" },
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
    }, 200);
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
      className="py-16 bg-black text-white border-t border-zinc-800 font-mono selection:bg-emerald-500 selection:text-black"
      style={{ scrollMarginTop: "80px" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI INTEGRATION PROTOCOL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            EXECUTION WORKFLOW
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Record terminal sessions locally, scrub sensitive credentials automatically, and reconstitute exact terminal state snapshots on demand.
          </p>
        </div>

        {/* TAB NAVIGATION GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CODE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`p-4 border text-left transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-white text-black border-white"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-3">
                  <span className="tabular-nums">[{tab.step}]</span>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block uppercase tracking-wider">{tab.label}</span>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? "text-zinc-700" : "text-zinc-500"}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* TERMINAL DISPLAY BOX */}
        <div className="bg-zinc-950 border border-zinc-800 space-y-0">
          {/* TERMINAL TITLEBAR */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-zinc-700" />
              <span className="w-2.5 h-2.5 bg-zinc-700" />
              <span className="w-2.5 h-2.5 bg-zinc-700" />
              <span className="ml-2 font-mono text-[11px] text-zinc-300">
                replay-cli — {activeTab.id}.sh
              </span>
            </div>

            <div className="text-[10px] text-emerald-400 font-mono">
              STATUS: ACTIVE
            </div>
          </div>

          {/* COMMAND ENTRY BAR */}
          <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm overflow-x-auto w-full sm:w-auto">
              <span className="text-emerald-400 font-bold select-none">$</span>
              <span className="text-white font-bold">{activeTab.command}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY COMMAND</span>
                </>
              )}
            </button>
          </div>

          {/* SIMULATED STDOUT DISPLAY */}
          <div className="p-5 font-mono text-xs min-h-[180px] bg-black space-y-2">
            {activeTab.outputLines.slice(0, visibleLineCount).map((line, idx) => (
              <div key={idx} className={`leading-relaxed ${line.color || "text-zinc-300"}`}>
                {line.text}
              </div>
            ))}

            {visibleLineCount < activeTab.outputLines.length && (
              <div className="flex items-center gap-1 text-zinc-500 text-xs pt-1">
                <span className="w-2 h-3 bg-emerald-400 animate-pulse inline-block" />
                <span>executing...</span>
              </div>
            )}
          </div>
        </div>

        {/* FEATURE CAPABILITIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>PTY ENGINE</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase">SUB-MILLISECOND LOGGING</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Captures native pseudoterminal (PTY) stdout, stdin, and window resize events with microsecond precision.
            </p>
          </div>

          <div className="p-5 bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DLP SCRUBBER</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase">AUTOMATIC REDACTION</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Scubs API keys, database credentials, and Bearer tokens before writing session files to disk or cloud.
            </p>
          </div>

          <div className="p-5 bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              <span>STATE FORKING</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase">SUBSHELL TIME-TRAVEL</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reconstitutes environment variables and working directory snapshots into a live interactive terminal subshell.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
