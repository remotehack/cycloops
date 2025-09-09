import './style.css'
import Dexie, { type EntityTable } from "dexie";

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

const form = document.querySelector("form")!;
const posts = document.querySelector("ol")!;

async function update() {
  const notes = await db.notes.orderBy("time").reverse().toArray();

  console.log(notes);

  posts.innerHTML = "";

  for (const note of notes) {
    const li = document.createElement("li");

    const timestamp = new Date(note.time);
    li.innerText = `${note.text} (${timestamp.toLocaleString()})`;

    posts.appendChild(li);
  }
}

update();

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

  update();

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

