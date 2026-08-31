import {
  AudioWaveform,
  Gauge,
  SearchCode,
  Server,
  ShieldCheck,
  SkipForward,
  Terminal,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    id: "01",
    title: "ACTIVITY WAVEFORM",
    desc: "Visual telemetry index mapping output density across timeline. Jump directly to active execution spikes.",
    icon: AudioWaveform,
  },
  {
    id: "02",
    title: "INSTANT STATE SEEKING",
    desc: "Scrub to any timestamp in the session. Instant PTY state reconstruction without buffering delays.",
    icon: SkipForward,
  },
  {
    id: "03",
    title: "OUTPUT SEARCH ENGINE",
    desc: "Search stdout/stderr buffer text across recorded sessions with microsecond-accurate timestamp matches.",
    icon: SearchCode,
  },
  {
    id: "04",
    title: "VARIABLE SPEED PLAYBACK",
    desc: "Adjust playback speed (0.5x, 1x, 2x, 4x, 8x) or skip idle terminal inactivity automatically.",
    icon: Gauge,
  },
  {
    id: "05",
    title: "SECRET REDACTION (DLP)",
    desc: "Real-time regex scanning and scrubbing of AWS access keys, JWT bearer tokens, and environment secrets.",
    icon: ShieldCheck,
  },
  {
    id: "06",
    title: "SELF-HOSTABLE ENGINE",
    desc: "Deploy via single Docker Compose bundle. Complete data sovereignty with zero external dependencies.",
    icon: Server,
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-black text-white border-t border-zinc-800 py-16 font-mono selection:bg-emerald-500 selection:text-black"
      style={{ scrollMarginTop: "90px" }}
    >
      <div className="w-[95%] md:w-[85%] max-w-6xl mx-auto space-y-8">
        
        {/* HEADER BLOCK */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Terminal className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            ENGINE FEATURES
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            High-density features designed specifically for Linux terminal session recording, security auditing, and playback.
          </p>
        </div>

        {/* FEATURES GRID CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-zinc-950 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-xs text-zinc-500 font-bold tabular-nums">[{feature.id}]</span>
                    <Icon size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-600 uppercase">
                  <span>CAPABILITY METRIC</span>
                  <span className="text-emerald-500 font-bold">READY</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
