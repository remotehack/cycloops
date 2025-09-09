import './style.css'
import Dexie, { type EntityTable, liveQuery } from "dexie";
import { distance, type Coord } from "@turf/turf";
import { formatDistanceStrict } from "date-fns";

interface Note {
  id: number;
  time: number;
  text: string;
  lat: number;
  lon: number;
}

const db = new Dexie("Cycleoops") as Dexie & {
  notes: EntityTable<Note, "id">;
};

// Declare tables, IDs and indexes
db.version(1).stores({
  notes: "++id, time, text, lat, lon",
});

const query = liveQuery(() => db.notes.orderBy("time").reverse().toArray());

const number = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer",
  maximumSignificantDigits: 3,
});

query.subscribe({
  next(notes) {
    console.log("Subs", notes);

    posts.innerHTML = "";

    let last: Note | null = null;

    for (const note of notes) {
      if (last) {
        const far = distance([last.lon, last.lat], [note.lon, note.lat], {
          units: "kilometers",
        });
        const time = last.time - note.time;
        console.log(
          far,
          time,
          number.format(far),
          formatDistanceStrict(last.time, note.time)
        );

        const div = document.createElement("li");
        div.className = "delta";
        div.innerText = `${formatDistanceStrict(
          last.time,
          note.time
        )} · ${number.format(far)}`;

        posts.appendChild(div);
      }

      const li = document.createElement("li");
      li.className = "note";

      // const timestamp = new Date(note.time);
      li.innerText = note.text;

      posts.appendChild(li);

      last = note;
    }
  },
  error(err) {
    console.error(err);
  },
});

const form = document.querySelector("form")!;
const posts = document.querySelector("ol")!;

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const text = data.get("message") as string;
  const time = Date.now();

  const [lat, lon] = await new Promise<[number, number]>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position.coords);
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        resolve([0, 0]);
      }
    );
  });

  const noteId = await db.notes.add({
    time,
    text,
    lat,
    lon,
  });

  console.log(noteId);

  form.reset();
});


// resize any text areas to fit content
for(const textarea of document.querySelectorAll('textarea')) {

  textarea.addEventListener('input', () => {
      const padding = 12;

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight - (padding * 2)}px`;
  })
}

