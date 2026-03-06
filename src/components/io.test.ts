import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { notes } from "../state";
import { CycloopsIO } from "./io";
import type { Note } from "../db";
import { db } from "../db";
import { notesToGpx, gpxToNotes } from "../gpx";

customElements.define("cycloops-io", CycloopsIO);

// Mock db
vi.mock("../db", () => ({
  db: {
    notes: {
      add: vi.fn(),
    },
  },
}));

// Mock gpx module so we can control its output
vi.mock("../gpx", () => ({
  notesToGpx: vi.fn(() => "<gpx/>"),
  gpxToNotes: vi.fn(() => [
    { lat: 51.5, lon: -0.1, text: "Imported note", time: 1000000 },
  ]),
}));

const mockNotes: Note[] = [
  { id: 1, time: 1000, text: "Note A", lat: 10, lon: 20 },
];

describe("CycloopsIO component", () => {
  let io: CycloopsIO;

  beforeEach(() => {
    document.body.innerHTML = "";
    notes.value = mockNotes;
    io = document.createElement("cycloops-io") as CycloopsIO;
    document.body.appendChild(io);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an export button and an import button", () => {
    const buttons = io.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].title).toBe("Export GPX");
    expect(buttons[1].title).toBe("Import GPX");
  });

  it("renders a hidden file input for import", () => {
    const input = io.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.style.display).toBe("none");
    expect(input.accept).toContain(".gpx");
  });

  describe("handleExport", () => {
    it("creates a downloadable blob URL and triggers a click", () => {
      vi.mocked(notesToGpx).mockReturnValue("<gpx>data</gpx>");

      const mockUrl = "blob:mock-url";
      const createObjectURL = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue(mockUrl);
      const revokeObjectURL = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      const clickSpy = vi.fn();
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === "a") el.click = clickSpy;
        return el;
      });

      io.handleExport();

      expect(notesToGpx).toHaveBeenCalledWith(mockNotes);
      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });

  describe("handleImport", () => {
    it("reads a file and adds parsed notes to the db", async () => {
      const fakeGpxContent = "<gpx/>";
      const fakeFile = new File([fakeGpxContent], "ride.gpx", {
        type: "application/gpx+xml",
      });

      const input = io.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, "files", {
        value: [fakeFile],
        configurable: true,
      });

      await io.handleImport(input);

      expect(gpxToNotes).toHaveBeenCalledOnce();
      expect(db.notes.add).toHaveBeenCalledOnce();
      expect(db.notes.add).toHaveBeenCalledWith({
        lat: 51.5,
        lon: -0.1,
        text: "Imported note",
        time: 1000000,
      });
    });

    it("does nothing when no file is selected", async () => {
      const input = io.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, "files", {
        value: [],
        configurable: true,
      });

      await io.handleImport(input);

      expect(db.notes.add).not.toHaveBeenCalled();
    });

    it("resets the input value after import", async () => {
      const fakeFile = new File(["<gpx/>"], "ride.gpx");
      const input = io.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, "files", {
        value: [fakeFile],
        configurable: true,
      });

      await io.handleImport(input);

      expect(input.value).toBe("");
    });
  });
});
