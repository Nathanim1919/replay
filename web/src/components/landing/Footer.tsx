"use client";

import { useState } from "react";
import {
  Terminal,
  Heart,
  Copy,
  Check,
  ArrowUpRight,
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
    <footer className="bg-black text-white border-t border-zinc-800 py-14 font-mono selection:bg-emerald-500 selection:text-black">
      <div className="w-[95%] md:w-[85%] max-w-6xl mx-auto space-y-12">
        
        {/* TOP BRAND & CLI QUICK RECORD CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-zinc-900">
          
          {/* BRAND INFO */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white text-black font-bold">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">
                REPLAY ENGINE
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-zinc-900 border border-zinc-800">
                V1.0.0
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
              Capture, replay, and share pixel-perfect CLI terminal sessions directly in the browser. Powered by native Go pseudo-terminals and stream compression.
            </p>

            {/* LIVE SYSTEM STATUS BADGE */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
              <span className="uppercase text-emerald-400 font-bold">
                SYSTEM STATUS: OPERATIONAL
              </span>
            </div>
          </div>

          {/* QUICK CLI COMMAND COPY BOX */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
                <span>TERMINAL CLI ENTRY</span>
                <span>BASH / ZSH</span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-black border border-zinc-900 p-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 truncate text-white font-bold">
                  <span className="text-emerald-400">$</span>
                  <span className="select-all">replay record</span>
                </div>

                <button
                  onClick={handleCopyInstall}
                  className="px-2.5 py-1 text-[10px] font-bold text-black bg-white hover:bg-zinc-200 transition cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copied ? (
                    <span className="text-emerald-700 font-bold">COPIED</span>
                  ) : (
                    <span>COPY</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS GRID WITH ANTHROPIC HOVER EFFECT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-2 border-b border-zinc-900">
          
          {/* PRODUCT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              PRODUCT SUITE
            </h3>
            <ul className="space-y-2.5 group/product">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-xs text-zinc-400 group-hover/product:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* DEVELOPERS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              DEVELOPERS
            </h3>
            <ul className="space-y-2.5 group/devs">
              {footerNavigation.developers.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-xs text-zinc-400 group-hover/devs:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    <span>{item.name}</span>
                    {item.external && (
                      <ArrowUpRight className="w-3 h-3 text-zinc-600" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              COMMUNITY
            </h3>
            <ul className="space-y-2.5 group/community">
              {footerNavigation.community.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-xs text-zinc-400 group-hover/community:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    <span>{item.name}</span>
                    {item.external && (
                      <ArrowUpRight className="w-3 h-3 text-zinc-600" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* OPEN SOURCE */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              OPEN SOURCE
            </h3>
            <div className="space-y-2.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% FREE & OPEN SOURCE</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Distributed under the permissive MIT license. Feel free to embed, adapt, or contribute.
              </p>
              <a
                href="https://github.com/Nathanim1919/replay"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white border border-zinc-800 transition mt-1"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>STAR ON GITHUB</span>
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>
            © {new Date().getFullYear()} REPLAY ENGINE. RELEASED UNDER THE{" "}
            <a
              href="https://github.com/Nathanim1919/replay/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-emerald-400 font-bold uppercase underline"
            >
              MIT LICENSE
            </a>
            .
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://nathanim.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
            >
              <span>CRAFTED WITH</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
              <span>
                BY <strong className="font-bold text-white">NATHANIM</strong>
              </span>
            </a>

            <a
              href="https://github.com/Nathanim1919/replay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition"
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