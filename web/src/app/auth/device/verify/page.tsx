"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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
      setMessage("Missing verification code.");
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
      setMessage("Device authorized successfully. You can return to your terminal.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Approval failed.");
    }
  };

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-zinc-800/90 bg-zinc-950 p-7 shadow-2xl font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold tracking-widest text-zinc-100 uppercase">REPLAY</span>
          <span className="text-zinc-700 text-xs">/</span>
          <span className="font-mono text-[11px] text-zinc-400">CLI AUTH</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          Device Pair
        </span>
      </div>

      {/* Title & Description */}
      <div className="mt-6 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          Authorize Terminal CLI
        </h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed font-normal">
          Verify the code generated in your command line to grant access to your Replay account.
        </p>
      </div>

      {/* User Context */}
      {user && (
        <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 text-[11px]">Logged in as:</span>
          <span className="text-zinc-200 font-medium">{user.email}</span>
        </div>
      )}

      {/* Verification Code Box */}
      <div className="mt-5 space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          <span>Verification Token</span>
        </div>
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/80 py-5 text-center shadow-inner">
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.35em] text-white">
            {userCode || "--------"}
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      {!isLoading && !isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-zinc-400 text-center font-mono">
            Authentication required to complete device setup.
          </p>
          <div className="space-y-2">
            <Link
              href={`/signin?redirect=${encodeURIComponent(`/auth/device/verify?user_code=${userCode}`)}`}
              className="flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.99] cursor-pointer shadow-sm"
            >
              Sign In & Authorize
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(`/auth/device/verify?user_code=${userCode}`)}`}
              className="flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white active:scale-[0.99] cursor-pointer"
            >
              Create New Account
            </Link>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleApprove}
          disabled={!hasUserCode || status === "loading" || status === "approved" || isLoading}
          className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          {status === "loading" ? "Authorizing..." : status === "approved" ? "Approved" : "Approve Device"}
        </button>
      )}

      {/* Feedback Messages */}
      {!hasUserCode && (
        <p className="mt-3.5 text-xs text-zinc-500 font-mono text-center">
          Missing user verification code in URL.
        </p>
      )}

      {message && (
        <div className="mt-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-center text-xs font-mono text-zinc-300">
          {message}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-900 text-center text-[11px] font-mono text-zinc-500">
        Your CLI session will pair automatically once approved.
      </div>
    </div>
  );
}

export default function DeviceVerifyPage() {
  return (
    <div className="min-h-screen w-full bg-black text-white grid place-items-center p-4 font-sans selection:bg-zinc-800 selection:text-white">
      <Suspense fallback={<div className="text-zinc-600 font-mono text-xs">Loading verification...</div>}>
        <DeviceVerifyForm />
      </Suspense>
    </div>
  );
}
