"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { Terminal, Sun, Moon } from "lucide-react";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-amber-200 py-3">
      <nav
        className="max-w-6xl mx-auto flex items-center justify-around px-6"
        style={{ background: "transparent" }}
      >
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-md"
            style={{ background: "var(--feature-icon-bg)" }}
            aria-hidden
          >
            <Terminal
              size={18}
              strokeWidth={2.25}
              style={{ color: "var(--feature-icon-fg)" }}
            />
          </div>

          <span
            className="text-xl font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Replay
          </span>
        </div>

        {/* Center: Navigation (hidden on small screens) */}
        <div className="hidden sm:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            How it works
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Nathanim1919/replay"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            GitHub
          </a>
          <Link
            href={"/signin"}
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </Link>
          <Link
            href={"/signup"}
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign Up
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-sm">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </nav>
    </header>
  );
}
