"use client"

import {useRef, useEffect, useImperativeHandle, forwardRef} from "react"
import {Terminal as XTerm, ITheme} from "@xterm/xterm"
import {FitAddon} from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

export interface TerminalHandle {
    write: (data: string) => void
    reset: () => void
}

export const terminalThemes: Record<string, ITheme> = {
  dark: {
    background: "#0d0d0d",
    foreground: "#e0e0e0",
    cursor: "#e0e0e0",
    selectionBackground: "#3b82f644",
    black: "#1a1a1a",
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#eab308",
    blue: "#3b82f6",
    magenta: "#a855f7",
    cyan: "#06b6d4",
    white: "#e0e0e0",
    brightBlack: "#555",
    brightRed: "#f87171",
    brightGreen: "#4ade80",
    brightYellow: "#facc15",
    brightBlue: "#60a5fa",
    brightMagenta: "#c084fc",
    brightCyan: "#22d3ee",
    brightWhite: "#ffffff",
  },
  light: {
    background: "#fafafa",
    foreground: "#1a1a1a",
    cursor: "#1a1a1a",
    selectionBackground: "#3b82f633",
    black: "#1a1a1a",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#ca8a04",
    blue: "#2563eb",
    magenta: "#9333ea",
    cyan: "#0891b2",
    white: "#e5e5e5",
    brightBlack: "#737373",
    brightRed: "#ef4444",
    brightGreen: "#22c55e",
    brightYellow: "#eab308",
    brightBlue: "#3b82f6",
    brightMagenta: "#a855f7",
    brightCyan: "#06b6d4",
    brightWhite: "#fafafa",
  },
  monokai: {
    background: "#272822",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selectionBackground: "#49483e",
    black: "#272822",
    red: "#f92672",
    green: "#a6e22e",
    yellow: "#f4bf75",
    blue: "#66d9ef",
    magenta: "#ae81ff",
    cyan: "#a1efe4",
    white: "#f8f8f2",
    brightBlack: "#75715e",
    brightRed: "#f92672",
    brightGreen: "#a6e22e",
    brightYellow: "#f4bf75",
    brightBlue: "#66d9ef",
    brightMagenta: "#ae81ff",
    brightCyan: "#a1efe4",
    brightWhite: "#f9f8f5",
  },
}

interface TerminalProps {
  width: number
  height: number
  theme?: string
  preview?: boolean
}

// eslint-disable-next-line react/display-name
const Terminal = forwardRef<TerminalHandle, TerminalProps>(({width, height, theme = "dark", preview}, ref) => {
    const divRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<XTerm | null>(null)

   useEffect(() => {
  if (!divRef.current) return

  const term = new XTerm({
    cursorBlink: !preview,
    scrollback: 0,
    fontSize: preview ? 12 : 14,
    disableStdin: preview,
    theme: terminalThemes[theme] || terminalThemes.dark,
  })

  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(divRef.current)

  // 🔥 important: wait for layout
  setTimeout(() => {
    fitAddon.fit()
  }, 0)

  termRef.current = term

  return () => {
    term.dispose()
  }
}, [theme, preview])

    // Update theme without re-creating terminal
    useEffect(() => {
        if (termRef.current) {
            termRef.current.options.theme = terminalThemes[theme] || terminalThemes.dark
        }
    }, [theme])

    useImperativeHandle(ref, () => ({
        write: (data: string) => termRef.current?.write(data),
        reset: () => termRef.current?.reset(),
    }))

 return (
  <div
    ref={divRef}
    className="w-full h-full min-h-65 overflow-hidden"
  />
)
})

export default Terminal
