"use client";

import Link from "next/link";
import { LogOut, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black backdrop-blur-xl">
      <nav className="mx-auto flex p-2 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white"
        >
          <Terminal size={18} />
          <span>Replay</span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href={
            `${isAuthenticated ? "#recordings" : "#features"}`
            } className="hover:text-white transition-colors">
            {isAuthenticated ? "Recordings" : "Features"}
          </a>

          <a
            href="#how-it-works"
            className="hover:text-white transition-colors"
          >
            How it Works
          </a>

          <a
            href="https://github.com/Nathanim1919/replay"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="rounded-lg cursor-pointer hover:opacity-60 px-4 py-2 text-sm font-medium text-white transition"
            >
              <LogOut />
            </button>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
/
              <Link
                href="/signup"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}