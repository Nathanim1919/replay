"use client";

import { useState } from "react";
import { Sparkles, Send, Terminal, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AICopilot() {
  const { currentTelemetry, currentTime } = usePlayer();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Hi! I'm your Replay AI Assistant. Ask me anything about this session, executed commands, or OS telemetry context.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    // Simulate AI response stream
    setTimeout(() => {
      let aiResponse = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("command") || lower.includes("executed")) {
        aiResponse = "Based on the terminal session stream, key executed commands include:\n• `cd /tmp` (directory shift)\n• `go build -o bin/app ./...` (compile binary)\n• `exit` (clean exit)";
      } else if (lower.includes("error") || lower.includes("fail")) {
        aiResponse = "1 potential error log was detected near timestamp 01:12:\n`error: failed to resolve dependency`\nRecommendation: Verify module cache or vendor dependencies.";
      } else if (lower.includes("fork") || lower.includes("run")) {
        aiResponse = `You can fork this session live in your terminal using:\n$ replay fork demo.replay --time=${currentTime.toFixed(1)}`;
      } else {
        aiResponse = `Analyzing timeline offset ${currentTime.toFixed(1)}s:\n• Active PID: ${currentTelemetry?.pid || "N/A"}\n• Working Directory: ${currentTelemetry?.cwd || "/app"}\nAll DLP security rules are currently active.`;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: aiResponse }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-mono text-xs text-zinc-300">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <Sparkles size={16} /> Replay AI Copilot
        </div>
        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">v1.0</span>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-b border-zinc-800/60 bg-zinc-900/30 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setInput("What commands were run?")}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded text-[11px] text-zinc-300 whitespace-nowrap cursor-pointer"
        >
          ⚡ Commands
        </button>
        <button
          onClick={() => setInput("Did any errors occur?")}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded text-[11px] text-zinc-300 whitespace-nowrap cursor-pointer"
        >
          🔍 Errors
        </button>
        <button
          onClick={() => setInput("How do I fork this session?")}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded text-[11px] text-zinc-300 whitespace-nowrap cursor-pointer"
        >
          🚀 Fork
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-lg border ${
              m.role === "user"
                ? "bg-orange-950/30 border-orange-500/30 text-orange-200 ml-6"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-300 mr-6"
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
          </div>
        ))}

        {loading && (
          <div className="p-2.5 rounded-lg border bg-zinc-900/80 border-zinc-800 text-zinc-400 mr-6 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            Analyzing session stream...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
        <input
          type="text"
          placeholder="Ask AI about this session..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-zinc-700"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-1.5 rounded cursor-pointer transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
