"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

function DeviceVerifyForm() {
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "error">("idle");
  const [message, setMessage] = useState("");

  const hasUserCode = userCode.length > 0;

  const handleApprove = async () => {
    if (!hasUserCode) {
      setStatus("error");
      setMessage("Missing user code.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/auth/device/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_code: userCode }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Approval failed");
      }

      setStatus("approved");
      setMessage("This device is now approved. You can return to the terminal.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Approval failed.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Replay device login</p>
      <h1 className="mt-3 text-3xl font-bold">Approve this terminal session</h1>
      <p className="mt-3 text-slate-300">
        Confirm the code below to allow the CLI to finish logging in.
      </p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">User code</div>
        <div className="mt-2 text-3xl font-mono font-bold tracking-[0.4em] text-emerald-400">
          {userCode || "—"}
        </div>
      </div>

      <button
        type="button"
        onClick={handleApprove}
        disabled={!hasUserCode || status === "loading" || status === "approved"}
        className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Approving..." : status === "approved" ? "Approved" : "Approve device"}
      </button>

      {!hasUserCode ? (
        <p className="mt-4 text-sm text-rose-400">Missing user code in the URL.</p>
      ) : null}

      {message ? (
        <p className={`mt-4 text-sm ${status === "error" ? "text-rose-400" : "text-emerald-400"}`}>
          {message}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-slate-400">
        After approval, the terminal will continue automatically.
      </p>
    </div>
  );
}

export default function DeviceVerifyPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-white p-6">
      <Suspense fallback={<div className="text-slate-400 font-mono">Loading device verification...</div>}>
        <DeviceVerifyForm />
      </Suspense>
    </div>
  );
}
