import {
  AudioWaveform,
  Gauge,
  SearchCode,
  Server,
  ShieldCheck,
  SkipForward,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  title: string;
  desc: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Activity Waveform",
    desc: "Visual fingerprint of your session. See where output happened at a glance — jump to the interesting parts.",
    icon: AudioWaveform,
  },
  {
    title: "Instant Seeking",
    desc: "Scrub to any point in the recording. No buffering, no waiting — terminal state reconstructed instantly.",
    icon: SkipForward,
  },
  {
    title: "Search Terminal Output",
    desc: "Find any text that appeared during the session. Results are timestamped — click to jump.",
    icon: SearchCode,
  },
  {
    title: "Speed Control",
    desc: "Play at 1x, 2x, 4x, or 8x speed. Skip the boring parts, slow down on the interesting ones.",
    icon: Gauge,
  },
  {
    title: "Secret Redaction (DLP)",
    desc: "Inline detection and scrubbing of AWS keys, JWTs, passwords, and other secrets before they hit disk.",
    icon: ShieldCheck,
  },
  {
    title: "Self-Hostable",
    desc: "Run the server on your own infrastructure. Your data stays yours. Docker Compose one-command setup.",
    icon: Server,
  },
];

export default function Features() {
  return (
    <div
      id="features"
      className="max-w-[80%] mx-auto mt-10"
      style={{ scrollMarginTop: "90px" }}
    >
      <div className="flex flex-col py-10">
        <h2
          className="text-5xl sm:text-6xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Built for developers
        </h2>
        <p
          className="mt-3 text-xl sm:text-2xl font-medium leading-snug max-w-3xl"
          style={{ color: "var(--text-heading)" }}
        >
          Every feature exists because plain terminal recordings aren&apos;t
          enough.
        </p>
      </div>
      <div
        className="bg-cover bg-center bg-no-repeat border border-(--border-strong) border-r-0 border-b-0"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          backgroundImage:
            "radial-gradient(ellipse at top left, var(--hero-overlay) 0%, transparent 70%), linear-gradient(var(--hero-overlay-base), var(--hero-overlay-base)), url('/hero-bg.jpeg')",
        }}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-8 sm:p-10 border border-(--border-strong) border-l-0 border-t-0"
            >
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-(--border)"
                style={{
                  background: "var(--feature-icon-bg)",
                  color: "var(--feature-icon-fg)",
                }}
              >
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <h3
                className="font-extrabold text-xl sm:text-2xl tracking-tight mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm sm:text-base leading-relaxed max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
