"use client"

import { useEffect, useState, useCallback } from "react"
import Player from "@/components/Player"
import { Check, Copy, Terminal } from "lucide-react"

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [command])

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer border"
      style={{ background: "var(--copy-cmd-bg)", borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>$</span>
      <span style={{ color: "var(--text-secondary)" }}>{command}</span>
      <span
        className="ml-1 flex items-center justify-center transition-opacity"
        style={{ color: "var(--text-tertiary)" }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} className="opacity-80 group-hover:opacity-80 transition-opacity" />}
      </span>
    </button>
  )
}

export default function Hero() {
  const [demoContent, setDemoContent] = useState<string | null>(null)

  useEffect(() => {
    fetch("/test.replay")
      .then((res) => res.text())
      .then(setDemoContent)
      .catch(() => {})
  }, [])

  return (
    <div className="grid">
      {/* Side by side: text left, terminal right */}
      <div className="grid">
        <div className="w-full py-4 flex flex-col gap-4 items-center">
          {/* Badge above headline */}
        

          <div className="flex flex-col gap-2">
            <h1 className="text-6xl font-extrabold uppercase" style={{ color: "var(--hero-headline)" }}>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 relative rounded-sm"
                style={{ background: "var(--hero-tag-bg)", color: "var(--hero-tag-text)" }}
              >
                Terminal
                <Terminal size={22} strokeWidth={2.5} className="shrink-0" />
              </span> sessions,
            </h1>
            <h1 className="text-6xl font-extrabold uppercase" style={{ color: "var(--hero-headline-accent)" }}>
              beautifully replayed.
            </h1>
          </div>
          <p className="text-lg mt-1 max-w-2xl text-center" style={{ color: "var(--hero-body)" }}>
            Record your CLI as a lightweight, interactive event stream. Share pixel-perfect web replays. Stop pasting dead logs into Slack.
          </p>

          {/* Install commands */}
          <div className="flex items-center gap-3 mt-2">
            <CopyCommand command="go install github.com/nathanim1919/replay@latest" />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>or</span>
            <CopyCommand command="brew install replay" />
          </div>
        </div>

        <div
          className="self-start p-4 rounded-2xl md:w-5xl mx-auto"
          style={{ background: "var(--demo-panel-bg)" }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 rounded-t-lg px-4 py-2.5"
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderBottom: "none",
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
            <span className="ml-2 font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
              Replay demo
            </span>
          </div>
          <div
            className="overflow-hidden rounded-b-lg"
            style={{ background: "#000", border: "1px solid #333", borderTop: "none" }}
          >
            {demoContent ? (
              <div className="p-1">
                <Player content={demoContent} demo />
              </div>
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ height: "350px", color: "var(--text-tertiary)" }}
              >
                Loading demo...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
