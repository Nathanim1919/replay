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
    { name: "Explore Gallery", href: "/explore" },
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
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-300 relative py-16 text-black">
      <div className="w-[95%] md:w-[80%] mx-auto space-y-12">
        
        {/* TOP BRAND & CLI RECORD CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-gray-300">
          
          {/* BRAND INFO */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black text-white shadow-sm">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-black font-sans">
                Replay
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-black bg-gray-200 border border-gray-300 rounded-full">
                v1.0.0
              </span>
            </div>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-md">
              Capture, replay, and share pixel-perfect CLI terminal sessions directly in the browser. High-performance Go binaries with zero setup.
            </p>

            {/* LIVE SYSTEM STATUS BADGE */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs font-semibold text-gray-800 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-bold tracking-tight text-gray-900">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* QUICK CLI COMMAND COPY BOX */}
          <div className="lg:col-span-6 flex flex-col justify-center items-start lg:items-end">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-gray-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-600 font-bold">
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Start recording session</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">Bash / Zsh</span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-2 truncate text-black font-bold">
                  <span className="text-gray-400">$</span>
                  <span className="select-all">replay record</span>
                </div>

                <button
                  onClick={handleCopyInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black hover:text-white bg-white hover:bg-black border border-gray-300 hover:border-black rounded-lg transition cursor-pointer shrink-0"
                  title="Copy command to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-2 border-b border-gray-300">
          
          {/* PRODUCT */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black mb-4 font-sans">
              Product Suite
            </h3>
            <ul className="space-y-3">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-medium text-gray-600 hover:text-black transition inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {item.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* DEVELOPERS */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black mb-4 font-sans">
              Developers
            </h3>
            <ul className="space-y-3">
              {footerNavigation.developers.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium text-gray-600 hover:text-black transition inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {item.name}
                    </span>
                    {item.external && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black mb-4 font-sans">
              Community
            </h3>
            <ul className="space-y-3">
              {footerNavigation.community.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium text-gray-600 hover:text-black transition inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {item.name}
                    </span>
                    {item.external && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* OPEN SOURCE */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black mb-4 font-sans">
              Open Source
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2 font-bold text-black">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Free & Open Source</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                Replay is distributed under the permissive MIT license. Feel free to embed, adapt, or contribute.
              </p>
              <a
                href="https://github.com/Nathanim1919/replay"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-extrabold text-black hover:bg-black hover:text-white transition shadow-2xs mt-1"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>Star on GitHub</span>
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-600">
          <p>
            © {new Date().getFullYear()} Replay Engine. Released under the{" "}
            <a
              href="https://github.com/Nathanim1919/replay/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline font-bold"
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
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black transition"
            >
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>
                by <strong className="font-extrabold text-black">Nathanim</strong>
              </span>
            </a>

            <a
              href="https://github.com/Nathanim1919/replay"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-700 hover:text-black transition"
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