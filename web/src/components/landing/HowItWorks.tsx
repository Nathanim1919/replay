"use client";

import { useState } from "react";
import {
  CloudUpload,
  Disc3,
  Link2,
  Share2,
  Terminal,
  Upload,
  type LucideIcon,
} from "lucide-react";

type CmdLine = { text: string; variant?: "command" | "output" };

function normalizeCmd(cmd: CmdLine[] | string | undefined): CmdLine[] {
  if (!cmd) return [];
  if (typeof cmd === "string") {
    return cmd
      .split("\n")
      .map((line) =>
        line.startsWith("→ ")
          ? { text: line, variant: "output" as const }
          : { text: line.replace(/^\$ /, "") },
      );
  }
  return cmd;
}

function StepCommand({ lines }: { lines?: CmdLine[] | string }) {
  const items = normalizeCmd(lines);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((line, i) =>
        line.variant === "output" ? (
          <span
            key={i}
            className="font-mono text-[11px] leading-snug"
            style={{ color: "var(--text-tertiary)" }}
          >
            {line.text}
          </span>
        ) : (
          <code
            key={i}
            className="inline-block w-fit max-w-full rounded-md px-2 py-0.5 font-mono text-[11px] leading-snug border border-(--border)"
            style={{
              background: "var(--inline-cmd-bg)",
              color: "var(--inline-cmd-fg)",
            }}
          >
            {line.text}
          </code>
        ),
      )}
    </div>
  );
}

type Step = {
  step: string;
  title: string;
  icon: LucideIcon;
  hoverIcon: LucideIcon;
  spinOnHover?: boolean;
  desc: string;
  cmd: CmdLine[];
};

const steps: Step[] = [
  {
    step: "1",
    title: "Record",
    icon: Terminal,
    hoverIcon: Disc3,
    spinOnHover: true,
    desc: "Run replay record in your terminal. Work normally — every keystroke and output is captured with microsecond timing.",
    cmd: [{ text: "replay record" }],
  },
  {
    step: "2",
    title: "Upload",
    icon: Upload,
    hoverIcon: CloudUpload,
    desc: "When you're done, the session auto-uploads to your server. You get a share link instantly.",
    cmd: [
      { text: "exit" },
      { text: "→ replay.sh/s/x8f2k9", variant: "output" },
    ],
  },
  {
    step: "3",
    title: "Share",
    icon: Share2,
    hoverIcon: Link2,
    desc: "Anyone with the link can watch your session in the browser. Scrub, search, speed up — it's like a video but better.",
    cmd: [{ text: "replay.sh/s/x8f2k9" }],
  },
];

function StepCard({ item }: { item: Step }) {
  const [hovered, setHovered] = useState(false);
  const Icon = hovered ? item.hoverIcon : item.icon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-6 sm:p-8 border-r border-(--border-strong) flex flex-col justify-between"
    >
      <div
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-(--border)"
        style={{
          background: "var(--feature-icon-bg)",
          color: "var(--feature-icon-fg)",
        }}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className={hovered && item.spinOnHover ? "step-icon-spin" : undefined}
        />
      </div>
      <h3
        className="font-extrabold text-xl sm:text-2xl tracking-tight mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {item.title}
      </h3>
      <p
        className="text-sm sm:text-base leading-relaxed mb-5"
        style={{ color: "var(--text-secondary)" }}
      >
        {item.desc}
      </p>
      <StepCommand lines={item.cmd} />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div
      id="how-it-works"
      className="max-w-[80%] mx-auto py-10"
      style={{ scrollMarginTop: "90px" }}
    >
      <h2
        className="text-5xl sm:text-6xl font-extrabold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        How it works
      </h2>
      <p
        className="mt-3 text-xl sm:text-2xl font-medium leading-snug"
        style={{ color: "var(--text-heading)", margin: "0 0 48px" }}
      >
        Three commands. Zero configuration.
      </p>
      <div
        className="grid gap-6 sm:grid-cols-2 sm:gap-0 lg:grid-cols-3 border border-(--border-strong) border-r-0 overflow-hidden"
        style={{ background: "var(--bg-elevated)" }}
      >
        {steps.map((item) => (
          <StepCard key={item.step} item={item} />
        ))}
      </div>
    </div>
  );
}
