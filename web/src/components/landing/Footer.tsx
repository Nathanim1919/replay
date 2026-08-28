"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Heart,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const footerNavigation = {
  product: [
    { name: "Terminal Engine", href: "#products-suite" },
    { name: "Web Player", href: "#products-suite" },
    { name: "Instant Seeking", href: "#products-suite" },
    { name: "Skip-Idle Playback", href: "#products-suite" },
    { name: "Embeddable Player", href: "#products-suite" },
  ],
  developers: [
    { name: "Documentation", href: "https://github.com/Nathanim1919/replay#readme", external: true },
    { name: "Architecture", href: "https://github.com/Nathanim1919/replay/blob/main/ARCHITECTURE.md", external: true },
    { name: "CLI Quickstart", href: "https://github.com/Nathanim1919/replay", external: true },
    { name: "API Reference", href: "https://github.com/Nathanim1919/replay", external: true },
    { name: "Releases", href: "https://github.com/Nathanim1919/replay/releases", external: true },
  ],
  community: [
    { name: "GitHub Repository", href: "https://github.com/Nathanim1919/replay", external: true },
    { name: "Issue Tracker", href: "https://github.com/Nathanim1919/replay/issues", external: true },
    { name: "Discussions", href: "https://github.com/Nathanim1919/replay/discussions", external: true },
    { name: "MIT License", href: "https://github.com/Nathanim1919/replay/blob/main/LICENSE", external: true },
  ],
};

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const installCmd = "replay record";

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <footer className="relative bg-[#faf9f6] border-t border-stone-200 text-stone-800 pt-16 pb-12 transition-colors duration-300">
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 space-y-14">
        
        {/* TOP BRAND & CTA SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-stone-200">
          {/* BRAND COLUMN */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f0ede6] border border-stone-300 text-[#cc785c]">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-[#191817] font-sans">
                Replay
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-[#cc785c] bg-[#cc785c]/10 border border-[#cc785c]/25 rounded-full">
                v1.0.0
              </span>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed max-w-md">
              Capture, replay, and share pixel-perfect CLI terminal sessions directly in the browser. Built with high-performance Go binaries and instant canvas playback.
            </p>

            {/* LIVE SYSTEM STATUS BADGE */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 shadow-xs text-xs text-stone-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] font-medium tracking-wide text-stone-700">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* QUICK CLI COMMAND COPY CARD */}
          <div className="lg:col-span-7 flex flex-col justify-center items-start lg:items-end">
            <div className="w-full max-w-md p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-stone-600">
                  <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>Start recording terminal session</span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">Bash / Zsh</span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#f5f4ef] border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 truncate text-[#191817]">
                  <span className="text-[#cc785c] font-semibold">$</span>
                  <span className="select-all font-medium">replay record</span>
                </div>

                <button
                  onClick={handleCopyInstall}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  title="Copy command to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4 border-b border-stone-200">
          {/* PRODUCT */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191817] mb-4 font-mono">
              Product Suite
            </h3>
            <ul className="space-y-2.5">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-stone-600 hover:text-[#cc785c] transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {item.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* DEVELOPERS */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191817] mb-4 font-mono">
              Developers
            </h3>
            <ul className="space-y-2.5">
              {footerNavigation.developers.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-sm text-stone-600 hover:text-[#cc785c] transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {item.name}
                    </span>
                    {item.external && (
                      <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-[#cc785c] transition-colors" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191817] mb-4 font-mono">
              Community
            </h3>
            <ul className="space-y-2.5">
              {footerNavigation.community.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-sm text-stone-600 hover:text-[#cc785c] transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {item.name}
                    </span>
                    {item.external && (
                      <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-[#cc785c] transition-colors" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* LEGAL & OPEN SOURCE */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191817] mb-4 font-mono">
              Open Source
            </h3>
            <div className="space-y-3 text-sm text-stone-600">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Free & Open Source</span>
              </div>
              <p className="text-xs leading-relaxed text-stone-500">
                Replay is distributed under the permissive MIT license. Feel free to embed, adapt, or contribute to the core recorder engine.
              </p>
              <a
                href="https://github.com/Nathanim1919/replay"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-medium text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs mt-1"
              >
                <GithubIcon className="w-3.5 h-3.5 text-stone-700" />
                <span>Star on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} Replay Engine. Released under the{" "}
            <a
              href="https://github.com/Nathanim1919/replay/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-700 hover:underline underline-offset-2"
            >
              MIT License
            </a>
            .
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://nathanim.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>
                by <strong className="font-semibold text-stone-800">Nathanim</strong>
              </span>
            </a>

            <a
              href="https://github.com/Nathanim1919/replay"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-stone-200/60 text-stone-600 hover:text-stone-900 transition-colors"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}