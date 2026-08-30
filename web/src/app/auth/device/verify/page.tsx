"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Terminal, CheckCircle2, Lock, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

function DeviceVerifyForm() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const userCode = searchParams.get("user_code") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "error">("idle");
  const [message, setMessage] = useState("");

  const hasUserCode = userCode.length > 0;

  const handleApprove = async () => {
    if (!hasUserCode) {
      setStatus("error");
      setMessage("Missing user verification code.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetchWithAuth("/api/auth/device/approve", {
        method: "POST",
        body: JSON.stringify({ user_code: userCode }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
          throw new Error("You must be logged in to approve this device.");
        }
        throw new Error(text || "Approval failed");
      }

      setStatus("approved");
      setMessage("Device successfully authorized! Your terminal is ready to go.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Approval failed.");
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl transition-all">
      {/* Background Ambient Glow Effects */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header & Logo */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Terminal size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-400">
              Security Portal
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Replay Device Link</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 font-mono">
          <ShieldCheck size={13} />
          <span>OAuth 2.0</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Authorize Terminal CLI
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Confirm the device code generated in your terminal to securely pair your active session with your Replay cloud account.
        </p>
      </div>

      {/* User Context Banner */}
      {user && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-300">
          <span className="text-slate-400 font-mono text-[11px]">Authenticated Account:</span>
          <span className="font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {user.email}
          </span>
        </div>
      )}

      {/* User Verification Code Box */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-slate-400">
          <span>Verification Code</span>
          <span>8-Digit Token</span>
        </div>
        <div className="relative flex items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-inner">
          <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            {userCode || "--------"}
          </div>
        </div>
      </div>

      {/* Action CTA Buttons */}
      {!isLoading && !isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <Lock size={16} className="shrink-0 text-amber-400" />
            <span>Please log in to your account first to approve this terminal session.</span>
          </div>
          <Link
            href={`/login?redirect=/auth/device/verify?user_code=${userCode}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-3.5 font-bold text-slate-950 transition hover:opacity-95 shadow-lg shadow-emerald-500/25 text-sm"
          >
            <span>Log in & Authorize Device</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleApprove}
          disabled={!hasUserCode || status === "loading" || status === "approved" || isLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-3.5 font-bold text-slate-950 transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
        >
          {status === "loading" ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              <span>Authorizing Terminal...</span>
            </>
          ) : status === "approved" ? (
            <>
              <CheckCircle2 size={18} className="text-slate-950" />
              <span>Device Approved!</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-slate-950" />
              <span>Approve Device</span>
            </>
          )}
        </button>
      )}

      {/* Dynamic Status / Error Messages */}
      {!hasUserCode && (
        <div className="mt-4 flex items-center gap-2 text-xs text-rose-400 font-mono">
          <AlertCircle size={14} />
          <span>No user verification code provided in URL.</span>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-mono border ${
            status === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {status === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{message}</span>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500 font-mono">
        Once approved, your active terminal session will connect automatically.
      </div>
    </div>
  );
}

export default function DeviceVerifyPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white grid place-items-center p-4">
      <Suspense fallback={<div className="text-slate-400 font-mono text-sm">Loading verification session...</div>}>
        <DeviceVerifyForm />
      </Suspense>
    </div>
  );
}
