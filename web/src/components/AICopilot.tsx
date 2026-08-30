"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Terminal, ShieldAlert, Check, Copy, Bot, User, Cpu, Play, TerminalSquare } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
  codeSnippet?: string;
}

export default function AICopilot() {
  const { currentTelemetry, currentTime } = usePlayer();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hello! I am your Replay AI Copilot. I analyze live telemetry, command history, and execution context in real time.",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleCopyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    if (!queryText) setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setLoading(true);

    try {
      const contextInfo = `Time Offset: ${currentTime.toFixed(1)}s | PID: ${currentTelemetry?.pid || 1204} | CWD: ${currentTelemetry?.cwd || "/home/app"} | Active Command: ${currentTelemetry?.cmd || "bash"}`;
      
      const res = await fetchWithAuth("/api/copilot", {
        method: "POST",
        body: JSON.stringify({
          prompt: textToSend,
          context: contextInfo,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to streaming copilot server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, text: msg.text + parsed.token }
                        : msg
                    )
                  );
                }
              } catch {
                // ignore unparseable chunk
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: `⚠️ Copilot Notice: ${error instanceof Error ? error.message : "Service temporary unavailable"}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-xs text-slate-200">
      {/* Sleek Copilot Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              Replay AI Copilot
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-mono border border-emerald-500/20">
                ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Contextual session intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
          <Cpu size={12} className="text-purple-400" />
          <span>GPT-4o Replay Engine</span>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2.5 border-b border-slate-800/60 bg-slate-900/30 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => handleSend("What commands were run in this session?")}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Terminal size={12} className="text-indigo-400" />
          <span>Summarize Commands</span>
        </button>
        <button
          onClick={() => handleSend("Did any errors occur?")}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/50 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer whitespace-nowrap shadow-xs"
        >
          <ShieldAlert size={12} className="text-amber-400" />
          <span>Audit Errors</span>
        </button>
        <button
          onClick={() => handleSend("How do I fork this session locally?")}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Play size={12} className="text-emerald-400" />
          <span>Fork Subshell</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs ${
                m.role === "user"
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-600"
                  : "bg-gradient-to-tr from-indigo-600 to-purple-600"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`p-3 rounded-2xl border leading-relaxed shadow-sm text-xs ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-xs"
                    : "bg-slate-900/90 text-slate-200 border-slate-800 rounded-tl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>

                {/* Code Snippet Box */}
                {m.codeSnippet && (
                  <div className="mt-2.5 rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-400 relative overflow-x-auto group">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-sans">
                      <span className="flex items-center gap-1">
                        <TerminalSquare size={10} /> Terminal Code
                      </span>
                      <button
                        onClick={() => handleCopyCode(m.id, m.codeSnippet!)}
                        className="hover:text-white transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={10} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono leading-relaxed">{m.codeSnippet}</pre>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 font-mono block px-1">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing telemetry timeline...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask AI Copilot about commands, errors, or PIDs..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-xl cursor-pointer transition shadow-md shadow-indigo-600/20"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
