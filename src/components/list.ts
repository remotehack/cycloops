import { effect } from "@preact/signals-core";
import type { Note } from "../db";
import { notes, visible, focus } from "../state";
import { distance } from "@turf/turf";
import { formatDistanceStrict } from "date-fns/formatDistanceStrict";

const number = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer",
  maximumSignificantDigits: 3,
});

document.addEventListener("focusin", (e) => {
  const el = e.target as HTMLLIElement;
  if (el.dataset.id) {
    focus.value = parseFloat(el.dataset.id);
  }
});

document.addEventListener("focusout", () => {
  focus.value = -1;
});

export class CycloopsList extends HTMLOListElement {
  observer: IntersectionObserver;

  constructor() {
    super();

    // track which notes are visible on screen
    this.observer = new IntersectionObserver((entries) => {
      const next = new Set(visible.value);

      for (const entry of entries) {
        const id = (entry.target as HTMLLIElement).dataset.id;

        if (id) {
          if (entry.isIntersecting) {
            next.add(parseFloat(id));
          } else {
            next.delete(parseFloat(id));
          }
        }
      }

      visible.value = next;
    });

    this.addEventListener("click", (e) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.dataset.id) {
        el.focus();
      }
    });
  }

  connectedCallback() {
    const posts = this;
    const observer = this.observer;

    console.log("connected");

    // render the list of notes
    effect(() => {
      for (const li of posts.querySelectorAll("li")) {
        observer.unobserve(li);
      }

      posts.innerHTML = "";

      let last: Note | null = null;

      for (const note of notes.value) {
        if (last) {
          const far = distance([last.lon, last.lat], [note.lon, note.lat], {
            units: "kilometers",
          });
          const formatted = far > 1 ? number.format(far) : "<1 km";

          const div = document.createElement("li");
          div.className = "delta";
          div.innerText = `${formatDistanceStrict(
            last.time,
            note.time
          )} · ${formatted}`;

          posts.appendChild(div);
        }

        const li = document.createElement("li");
        li.className = "note";

        li.innerText = note.text;
        li.dataset.id = String(note.id);

        li.id = `note-${note.id}`;
        li.tabIndex = 0;

        posts.appendChild(li);

        last = note;
      }

      for (const li of posts.querySelectorAll("li")) {
        observer.observe(li);
      }
    });
  }
}
