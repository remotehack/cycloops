import { describe, it, expect } from "vitest";
import type { Note } from "./db";
import { notesToGpx, gpxToNotes } from "./gpx";

const note1: Note = {
  id: 1,
  time: new Date("2024-06-01T10:00:00.000Z").getTime(),
  text: "Coffee stop",
  lat: 51.5074,
  lon: -0.1278,
};

const note2: Note = {
  id: 2,
  time: new Date("2024-06-01T11:30:00.000Z").getTime(),
  text: "Top of the hill",
  lat: 51.52,
  lon: -0.11,
};

describe("notesToGpx", () => {
  it("produces valid GPX XML with waypoints", () => {
    const gpx = notesToGpx([note1, note2]);

    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1" creator="Cycloops"');
    expect(gpx).toContain(`lat="${note1.lat}" lon="${note1.lon}"`);
    expect(gpx).toContain(`lat="${note2.lat}" lon="${note2.lon}"`);
    expect(gpx).toContain("<name>Coffee stop</name>");
    expect(gpx).toContain("<name>Top of the hill</name>");
    expect(gpx).toContain("<time>2024-06-01T10:00:00.000Z</time>");
    expect(gpx).toContain("<time>2024-06-01T11:30:00.000Z</time>");
  });

  it("escapes special XML characters in note text", () => {
    const note: Note = {
      id: 3,
      time: Date.now(),
      text: 'Café & Bakery <great> place',
      lat: 0,
      lon: 0,
    };
    const gpx = notesToGpx([note]);
    expect(gpx).toContain("Café &amp; Bakery &lt;great&gt; place");
    expect(gpx).not.toContain("& Bakery <great>");
  });

  it("returns empty waypoints for empty notes array", () => {
    const gpx = notesToGpx([]);
    expect(gpx).toContain("<gpx");
    expect(gpx).not.toContain("<wpt");
  });
});

describe("gpxToNotes", () => {
  it("parses GPX waypoints into notes", () => {
    const gpx = notesToGpx([note1, note2]);
    const parsed = gpxToNotes(gpx);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      lat: note1.lat,
      lon: note1.lon,
      text: note1.text,
      time: note1.time,
    });
    expect(parsed[1]).toMatchObject({
      lat: note2.lat,
      lon: note2.lon,
      text: note2.text,
      time: note2.time,
    });
  });

  it("round-trips notes through GPX without data loss", () => {
    const gpx = notesToGpx([note1, note2]);
    const parsed = gpxToNotes(gpx);

    expect(parsed[0].text).toBe(note1.text);
    expect(parsed[0].lat).toBeCloseTo(note1.lat);
    expect(parsed[0].lon).toBeCloseTo(note1.lon);
    expect(parsed[0].time).toBe(note1.time);
  });

  it("unescapes XML entities back to plain text", () => {
    const note: Note = {
      id: 3,
      time: Date.now(),
      text: 'Café & Bakery <great>',
      lat: 0,
      lon: 0,
    };
    const gpx = notesToGpx([note]);
    const parsed = gpxToNotes(gpx);
    expect(parsed[0].text).toBe('Café & Bakery <great>');
  });

  it("returns empty array for GPX with no waypoints", () => {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"></gpx>`;
    const parsed = gpxToNotes(gpx);
    expect(parsed).toHaveLength(0);
  });

  it("throws on invalid XML", () => {
    expect(() => gpxToNotes("not xml at all <<>>")).toThrow("Invalid GPX file");
  });
});
