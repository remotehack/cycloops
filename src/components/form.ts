import { db } from "../db";

export class CycloopsForm extends HTMLFormElement {
  connectedCallback() {
    this.addEventListener("submit", this.submitHandler);

    // resize any text areas to fit content
    for (const textarea of this.querySelectorAll("textarea")) {
      textarea.addEventListener("input", () => {
        const padding = 12;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight - padding * 2}px`;
      });
    }
  }

  async submitHandler(e: Event) {
    e.preventDefault();

    const data = new FormData(this);
    const text = (data.get("message") as string).trim();

    if (!text) return;

    const time = Date.now();

    // Optimistically add the note immediately so it appears in the list
    const id = await db.notes.add({ time, text, lat: 0, lon: 0 });

    this.reset();

    // Update with real coordinates once geolocation resolves
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await db.notes.update(id, {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      async () => {
        // Keep lat/lon as 0,0 on failure — note is already saved
      }
    );
  }
}
