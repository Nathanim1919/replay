"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Terminal, ShieldAlert, Check, Copy, Bot, User, Play, TerminalSquare } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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
      text: "Replay AI Copilot initialized. Analyzing telemetry, command history, and execution context.",
      timestamp: "00:00",
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

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    const contextPayload = `Time: ${currentTime}s | PWD: ${currentTelemetry?.cwd || "/"} | Command: ${currentTelemetry?.cmd || "none"}`;

    try {
      const response = await fetchWithAuth("/api/copilot", {
        method: "POST",
        body: JSON.stringify({
          prompt: query,
          context: contextPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stream AI response");
      }

      if (!response.body) {
        throw new Error("No response stream body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const rawData = trimmed.replace("data: ", "");
          if (rawData === "[DONE]") break;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.token) {
              accumulatedText += parsed.token;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
                )
              );
            }
          } catch {
            // ignore non-json lines
          }
        }
      }
    } catch (err) {
      console.error("AI Streaming error:", err);
      toast.error("Failed to fetch response from Copilot");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: "Error: Unable to connect to AI copilot service." }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (msgId: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(msgId);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white border-l border-zinc-800 font-mono text-xs selection:bg-emerald-500 selection:text-black">
      {/* Industrial Copilot Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            AI SESSION COPILOT
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-black border border-zinc-800 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
          READY
        </span>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => handleSend("Summarize commands run in this session")}
          className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
        >
          <Terminal size={11} className="text-emerald-400" />
          <span>SUMMARIZE</span>
        </button>
        <button
          onClick={() => handleSend("Audit session for errors or non-zero exit codes")}
          className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
        >
          <ShieldAlert size={11} className="text-amber-400" />
          <span>AUDIT ERRORS</span>
        </button>
        <button
          onClick={() => handleSend("How do I fork this session locally?")}
          className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
        >
          <Play size={11} className="text-emerald-400" />
          <span>FORK COMMAND</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-6 h-6 border flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === "user"
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-emerald-400 border-zinc-800"
              }`}
            >
              {m.role === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>

            {/* Content Box */}
            <div className={`space-y-1 max-w-[88%] ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`p-3 border leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white border-zinc-700"
                    : "bg-zinc-950 text-zinc-200 border-zinc-800"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <div className="text-xs leading-relaxed space-y-2">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xs font-bold text-white border-b border-zinc-800 pb-1 mt-2 mb-1 uppercase tracking-wider">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-bold text-emerald-400 mt-2 mb-1 uppercase">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-bold text-zinc-300 mt-1 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="mb-1.5 text-zinc-300 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-emerald-400">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1 pl-1 text-zinc-300">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1 pl-1 text-zinc-300">{children}</ol>,
                        li: ({ children }) => <li className="text-xs text-zinc-300 leading-snug">{children}</li>,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-zinc-900 text-emerald-400 font-mono text-[11px] px-1 py-0.5 border border-zinc-800" {...props}>
                              {children}
                            </code>
                          ) : (
                            <div className="my-2 border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                              <pre className="whitespace-pre-wrap leading-relaxed">{children}</pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Code Snippet Box */}
                {m.codeSnippet && (
                  <div className="mt-2 border border-zinc-800 bg-black p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <TerminalSquare size={10} /> COMMAND
                      </span>
                      <button
                        onClick={() => handleCopyCode(m.id, m.codeSnippet!)}
                        className="hover:text-white transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedId === m.id ? (
                          <span className="text-emerald-400 font-bold">COPIED</span>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono leading-relaxed">{m.codeSnippet}</pre>
                  </div>
                )}
              </div>

              <span className="text-[9px] text-zinc-600 block uppercase">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-zinc-500 text-[11px] pt-1">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            <span>STREAMING RESPONSE...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Copilot about commands, errors..."
            className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
