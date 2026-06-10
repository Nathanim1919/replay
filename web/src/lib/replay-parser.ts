export interface ReplayHeader {
  version: number
  width: number
  height: number
  timestamp: number
  duration: number
  shell: string
  term?: string
  title?: string
  checkpoints?: number[]
}

export interface TerminalSize {
  Width: number
  Height: number
}

export interface MarkerData {
  Label: string
}

export interface ReplayEvent {
  time: number
  type: "o" | "i" | "r" | "c" | "m"
  data?: string
  size?: TerminalSize
  marker?: MarkerData
}

export interface ReplaySession {
  header: ReplayHeader
  events: ReplayEvent[]
}

export function parseReplay(content: string): ReplaySession {
 // Check if the content is Base64 encoded (starts with eyJ or similar string structure)
  // Or handle it selectively based on how you call this function.
  let rawText = content;
  
  if (content.startsWith("eyJ")) {
    try {
      rawText = atob(content); // Decodes Base64 to a UTF-8 string
    } catch (e) {
      console.error("Failed to decode Base64 content", e);
    }
  }

  const lines = rawText.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    throw new Error("Replay file is empty");
  }

  const header = JSON.parse(lines[0]) as ReplayHeader;

  const events: ReplayEvent[] = lines.slice(1).map((line) => {
    const arr = JSON.parse(line) as [number, string, unknown];
    const event: ReplayEvent = {
      time: arr[0],
      type: arr[1] as ReplayEvent["type"],
    };

    switch (event.type) {
      case "o":
      case "i":
        event.data = arr[2] as string;
        break;
      case "r":
        event.size = arr[2] as TerminalSize;
        break;
      case "m":
        event.marker = arr[2] as MarkerData;
        break;
    }

    return event;
  });

  return { header, events };
}

export function computeWaveform(events: ReplayEvent[], numBuckets: number): number[] {
  if (events.length === 0) return new Array(numBuckets).fill(0);

  // Find duration from last event
  const duration = events[events.length - 1].time;
  if (duration <= 0) return new Array(numBuckets).fill(0);

  const bucketWidth = duration / numBuckets;
  const buckets = new Array(numBuckets).fill(0);

  // Count output bytes per bucket
  for (const event of events) {
    if (event.type === "o" && event.data) {
      const index = Math.min(
        Math.floor(event.time / bucketWidth),
        numBuckets - 1
      );
      buckets[index] += event.data.length;
    }
  }

  // Normalize to 0-1 range
  // Use 95th percentile as max to prevent one huge burst
  // from flattening everything else
  const sorted = [...buckets].filter((v) => v > 0).sort((a, b) => a - b);
  const max =
    sorted.length > 0
      ? sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
      : 1;

  return buckets.map((v) => Math.min(v / max, 1.0));
}

// Strip ANSI escape codes from terminal output
function stripAnsi(str: string): string {
  return str.replace(
    // CSI sequences, OSC sequences, and other escape sequences
    /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b\(B|\x1b[>=]|[\x00-\x09\x0b-\x0c\x0e-\x1a]/g,
    ""
  );
}

export interface SearchIndex {
  plainText: string
  timeMap: number[]
}

export interface SearchResult {
  time: number
  context: string
  matchStart: number
}

// Build a searchable text index from events
export function buildSearchIndex(events: ReplayEvent[]): SearchIndex {
  let plainText = "";
  const timeMap: number[] = [];

  for (const event of events) {
    if (event.type === "o" && event.data) {
      const clean = stripAnsi(event.data);
      for (let i = 0; i < clean.length; i++) {
        timeMap.push(event.time);
      }
      plainText += clean;
    }
  }

  return { plainText, timeMap };
}

// Search the index for a query string
export function searchIndex(
  index: SearchIndex,
  query: string
): SearchResult[] {
  if (!query || query.length === 0) return [];

  const results: SearchResult[] = [];
  const lowerText = index.plainText.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let pos = 0;
  while (pos < lowerText.length) {
    const found = lowerText.indexOf(lowerQuery, pos);
    if (found === -1) break;

    // Extract surrounding context (40 chars each side)
    const contextStart = Math.max(0, found - 40);
    const contextEnd = Math.min(index.plainText.length, found + query.length + 40);
    let context = index.plainText.slice(contextStart, contextEnd).replace(/\r?\n/g, " ");
    if (contextStart > 0) context = "..." + context;
    if (contextEnd < index.plainText.length) context = context + "...";

    results.push({
      time: index.timeMap[found],
      context,
      matchStart: found - contextStart + (contextStart > 0 ? 3 : 0),
    });

    pos = found + query.length;
  }

  return results;
}