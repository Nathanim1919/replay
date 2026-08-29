import { parseReplay } from "./replay-parser";

/**
 * Downloads a string payload as a file in the browser.
 */
function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a .replay session payload to asciinema v2 (.cast) format.
 */
export function exportToCast(rawContent: string, title: string = "replay-session") {
  try {
    const session = parseReplay(rawContent);
    const { header, events } = session;

    // Asciinema v2 header
    const castHeader = {
      version: 2,
      width: header.width || 80,
      height: header.height || 24,
      timestamp: header.timestamp || Math.floor(Date.now() / 1000),
      title: header.title || title,
      env: {
        TERM: "xterm-256color",
        SHELL: header.shell || "/bin/bash",
      },
    };

    const lines: string[] = [JSON.stringify(castHeader)];

    for (const e of events) {
      if (e.type === "o" && e.data) {
        lines.push(JSON.stringify([e.time, "o", e.data]));
      } else if (e.type === "i" && e.data) {
        lines.push(JSON.stringify([e.time, "i", e.data]));
      } else if (e.type === "r" && e.size) {
        lines.push(JSON.stringify([e.time, "r", `${e.size.Width}x${e.size.Height}`]));
      }
    }

    const castPayload = lines.join("\n");
    const cleanFileName = (title || "session").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    downloadBlob(castPayload, `${cleanFileName}.cast`, "application/json");
    return true;
  } catch (err) {
    console.error("Failed to export to .cast format", err);
    return false;
  }
}

/**
 * Exports a styled terminal frame preview as a high-resolution SVG file for GitHub READMEs.
 */
export function exportToSvg(title: string = "Terminal Session", sampleOutput: string[] = ["$ replay record", "Session active..."]) {
  const width = 800;
  const headerHeight = 40;
  const padding = 20;
  const lineHeight = 22;
  const contentHeight = Math.max(160, sampleOutput.length * lineHeight + padding * 2);
  const totalHeight = headerHeight + contentHeight;

  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const renderedLines = sampleOutput
    .slice(0, 20)
    .map((line, idx) => {
      const y = headerHeight + padding + idx * lineHeight;
      const isPrompt = line.startsWith("$") || line.startsWith("#");
      const color = isPrompt ? "#10b981" : "#e4e4e7";
      return `<text x="${padding}" y="${y}" fill="${color}" font-family="Menlo, Monaco, 'Courier New', monospace" font-size="13">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}">
  <rect width="${width}" height="${totalHeight}" rx="12" fill="#09090b" stroke="#27272a" stroke-width="1.5" />
  
  <!-- Terminal Header Bar -->
  <path d="M 0 12 C 0 5.37 5.37 0 12 0 L ${width - 12} 0 C ${width - 5.37} 0 ${width} 5.37 ${width} 12 L ${width} ${headerHeight} L 0 ${headerHeight} Z" fill="#18181b" />
  
  <!-- Traffic Light Window Buttons -->
  <circle cx="20" cy="20" r="6" fill="#ef4444" />
  <circle cx="38" cy="20" r="6" fill="#f59e0b" />
  <circle cx="56" cy="20" r="6" fill="#10b981" />
  
  <!-- Title -->
  <text x="${width / 2}" y="24" text-anchor="middle" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(title)}</text>
  
  <!-- Output Body -->
  <g>
    ${renderedLines}
  </g>
</svg>`;

  const cleanFileName = (title || "session").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  downloadBlob(svgContent, `${cleanFileName}.svg`, "image/svg+xml");
  return true;
}

/**
 * Downloads the raw .replay format file directly.
 */
export function exportRawReplay(rawContent: string, title: string = "session") {
  const cleanFileName = (title || "session").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  downloadBlob(rawContent, `${cleanFileName}.replay`, "text/plain");
  return true;
}
