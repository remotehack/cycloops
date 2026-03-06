import { db } from "../db";
import { notes } from "../state";
import { notesToGpx, gpxToNotes } from "../gpx";

export class CycloopsIO extends HTMLElement {
  connectedCallback() {
    const exportBtn = document.createElement("button");
    exportBtn.title = "Export GPX";
    exportBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;
    exportBtn.addEventListener("click", () => this.handleExport());

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".gpx,application/gpx+xml";
    importInput.style.display = "none";
    importInput.addEventListener("change", () => this.handleImport(importInput));

    const importBtn = document.createElement("button");
    importBtn.title = "Import GPX";
    importBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;
    importBtn.addEventListener("click", () => importInput.click());

    this.appendChild(exportBtn);
    this.appendChild(importInput);
    this.appendChild(importBtn);
  }

  handleExport() {
    const gpx = notesToGpx(notes.value);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cycloops.gpx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async handleImport(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();
    const newNotes = gpxToNotes(text);

    for (const note of newNotes) {
      await db.notes.add(note);
    }

    input.value = "";
  }
}
