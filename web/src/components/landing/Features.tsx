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
      className=" mx-auto bg-gray-100 border-t border-gray-300 relative py-10"
      style={{ scrollMarginTop: "90px" }}
    >
      <div className="py-10 grid place-items-center">
        <h2
          className="text-5xl sm:text-6xl font-extrabold tracking-tight text-black"
        >
          Built for developers
        </h2>
        <p
          className="text-lg sm:text-xl text-gray-600 max-w-2xl text-center"
        >
          Every feature exists because plain terminal recordings aren&apos;t
          enough.
        </p>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-[95%] md:w-[80%] mx-auto bg-white  border border-gray-200 rounded-2xl"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-8 grid gap-2 opacity-60 hover:opacity-100 transition"
            >
              <div
                className="mb-5 flex h-16 w-16 text-gray-400 items-center justify-center"
              
              >
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <h3
                className="font-extrabold tracking-tight mb-2 text-black"
               
              >
                {feature.title}
              </h3>
              <p
                className="text-sm sm:text-base leading-relaxed max-w-md text-gray-700"
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
