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
    const text = data.get("message") as string;
    const time = Date.now();

    const [lat, lon] = await new Promise<[number, number]>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(position.coords);
            resolve([position.coords.latitude, position.coords.longitude]);
          },
          () => {
            resolve([0, 0]);
          }
        );
      }
    );

    await db.notes.add({
      time,
      text,
      lat,
      lon,
    });

    this.reset();
  }
}
