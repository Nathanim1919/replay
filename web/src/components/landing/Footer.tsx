import Link from "next/link";
import Image from "next/image";
import { Heart, Terminal } from "lucide-react";
import BgImage from "../../../public/9a0dc2a6-caff-4e6e-bf06-64f2729fac09.jpeg";

const links = [
  {
    label: "GitHub",
    href: "https://github.com/Nathanim1919/replay",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className="relative px-6 py-20 overflow-hidden border-t border-gray-200 text-black">
      
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0">
        <Image
          src={BgImage}
          alt="Footer background"
          fill
          priority
          className="object-cover opacity-30"
        />

        {/* overlay system (very important for readability) */}
        <div className="absolute inset-0 bg-linear-to-b from-white via-white/60 to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-12">
        
        {/* LEFT */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-3">
            <Terminal size={20} className="text-black/70" />
            <span className="text-xl font-semibold tracking-tight">
              Replay
            </span>
          </div>

          <p className="mt-4 text-sm text-black/50 leading-relaxed">
            Open-source terminal recording tool. Capture, share, and replay CLI
            sessions in the browser with pixel-perfect accuracy.
          </p>
        </div>

        {/* LINKS */}
        <nav className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-black/50 hover:text-black transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-black/50 hover:text-black transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>

      {/* DIVIDER */}
      <div className="relative max-w-6xl mx-auto mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        <p className="text-xs text-black/40">
          © {new Date().getFullYear()} Replay. MIT Licensed.
        </p>

        <a
          href="https://nathanim.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors"
        >
          Made with
          <Heart size={14} className="text-red-500/70" />
          by <span className="underline underline-offset-2">Nathanim</span>
        </a>
      </div>
    </footer>
  );
}