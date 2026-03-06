import type { Note } from "./db";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function notesToGpx(notes: Note[]): string {
  const waypoints = notes
    .map((note) => {
      const time = new Date(note.time).toISOString();
      return `  <wpt lat="${note.lat}" lon="${note.lon}">\n    <name>${escapeXml(note.text)}</name>\n    <time>${time}</time>\n  </wpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Cycloops" xmlns="http://www.topografix.com/GPX/1/1">\n${waypoints}\n</gpx>`;
}

export function gpxToNotes(gpx: string): Omit<Note, "id">[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpx, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Invalid GPX file");

  const wpts = doc.querySelectorAll("wpt");

  return Array.from(wpts).map((wpt) => {
    const lat = parseFloat(wpt.getAttribute("lat") ?? "0");
    const lon = parseFloat(wpt.getAttribute("lon") ?? "0");
    const text = wpt.querySelector("name")?.textContent ?? "";
    const timeStr = wpt.querySelector("time")?.textContent ?? "";
    const time = timeStr ? new Date(timeStr).getTime() : Date.now();

    return { lat, lon, text, time };
  });
}
