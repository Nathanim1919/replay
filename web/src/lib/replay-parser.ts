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
  const lines = content.split("\n").filter((line) => line.trim() !== "");
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