"use client";

import Link from "next/link";
import { LogOut, Terminal, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black font-mono selection:bg-emerald-500 selection:text-black">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* LOGO BRAND */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xs text-white uppercase tracking-wider group"
        >
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-bold">
            <Terminal size={14} />
          </div>
          <span>REPLAY</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse ml-0.5" />
        </Link>

        {/* NAVIGATION LINKS WITH ANTHROPIC HOVER EFFECT */}
        <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400 uppercase tracking-wider group/nav">
          <Link
            href="/explore"
            className="group-hover/nav:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200"
          >
            EXPLORE
          </Link>

          <a
            href={isAuthenticated ? "#recordings" : "#features"}
            className="group-hover/nav:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200"
          >
            {isAuthenticated ? "RECORDINGS" : "FEATURES"}
          </a>

          <a
            href="#how-it-works"
            className="group-hover/nav:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200"
          >
            WORKFLOW
          </a>

          <a
            href="https://github.com/Nathanim1919/replay"
            target="_blank"
            rel="noopener noreferrer"
            className="group-hover/nav:opacity-40 hover:!opacity-100 hover:text-emerald-400 transition-all duration-200 inline-flex items-center gap-0.5"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-600" />
          </a>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="p-2 border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition uppercase"
              >
                SIGN IN
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 bg-white text-black font-bold text-xs hover:bg-zinc-200 transition border border-white uppercase"
              >
                GET STARTED
              </Link>
            </div>
          )}
        </div>

      </nav>
    </header>
  );
}