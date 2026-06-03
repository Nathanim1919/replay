import Link from "next/link";
import { Heart, Terminal } from "lucide-react";

const links = [
  {
    label: "GitHub",
    href: "https://github.com/Nathanim1919/replay",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer
      className="max-w-6xl mx-auto px-6 py-14"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-3">
            <Terminal
              size={20}
              strokeWidth={2.25}
              style={{ color: "var(--feature-icon-fg)" }}
            />
            <span
              className="text-xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              Replay
            </span>
          </div>

          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Open-source terminal recording. Capture, share, and replay CLI
            sessions in the browser.
          </p>
        </div>

        <nav
          aria-label="Footer links"
          className="flex items-center gap-6 flex-wrap"
        >
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>

      <div
        className="mt-10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          © {new Date().getFullYear()} Replay. Open source under MIT.
        </p>

        <a
          href="https://nathanim.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          Made with
          <Heart
            size={14}
            strokeWidth={2}
            className="text-red-500/60 transition-colors group-hover:text-red-500"
          />
          by
          <span
            className="underline underline-offset-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Nathanim
          </span>
        </a>
      </div>
    </footer>
  );
}
