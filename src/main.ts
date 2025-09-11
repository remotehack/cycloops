import './style.css'
import Dexie, { type EntityTable, liveQuery } from "dexie";
import { bbox, distance } from "@turf/turf";
import { formatDistanceStrict } from "date-fns";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { computed, effect, signal } from "@preact/signals-core";

const form = document.querySelector("form")!;
const posts = document.querySelector("ol")!;

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

const number = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer",
  maximumSignificantDigits: 3,
});

const notes = signal<Note[]>([]);
const visible = signal(new Set<number>());
const focus = signal<number>(-1);

// populate notes from idb
const query = liveQuery(() => db.notes.orderBy("time").reverse().toArray());
query.subscribe({
  next(value) {
    notes.value = value;
  },
  error(err) {
    console.error(err);
  },
});

// track which notes are visible on screen
const observer = new IntersectionObserver((entries) => {
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

posts.addEventListener("click", (e) => {
  const el = e.target;
  if (el instanceof HTMLElement && el.dataset.id) {
    el.focus();
  }
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

// add a new note to indexed db
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

  await db.notes.add({
    time,
    text,
    lat,
    lon,
  });

  form.reset();
});

// resize any text areas to fit content
for (const textarea of document.querySelectorAll("textarea")) {
  textarea.addEventListener("input", () => {
    const padding = 12;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight - padding * 2}px`;
  });
}

type NoteLocations = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { id: number; text: string }
>;

const noteLocations = computed<NoteLocations>(() => ({
  type: "FeatureCollection",
  features: notes.value.map((note) => ({
    type: "Feature",
    properties: {
      id: note.id,
      text: note.text,
    },
    geometry: {
      type: "Point",
      coordinates: [note.lon, note.lat],
    },
  })),
}));

const visibleLocations = computed<NoteLocations>(() => {
  const all = noteLocations.value;

  const features = all.features.filter((p) =>
    visible.value.has(p.properties.id)
  );

  return { ...all, features };
});

const focusLocation = computed<NoteLocations>(() => {
  const all = noteLocations.value;

  const features = all.features.filter((p) => p.properties.id === focus.value);

  return { ...all, features };
});

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/positron",
  center: [0, 0],
  zoom: 1,
  interactive: false,
});

map.on("load", () => {
  // add a blank feature collection
  map.addSource("notes", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "notes_markers",
    type: "circle",
    source: "notes",
    paint: {
      "circle-radius": 5,
      "circle-color": "#f08",
    },
  });

  map.addSource("focus", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "focus_markers",
    type: "circle",
    source: "focus",
    paint: {
      "circle-radius": 10,
      "circle-color": "#08f",
    },
  });

  effect(() => {
    if (visibleLocations.value.features.length === 0) return;

    map.getSource<GeoJSONSource>("notes")?.setData(visibleLocations.value);

    const bounds = bbox(visibleLocations.value) as [
      number,
      number,
      number,
      number
    ];

    map.fitBounds(bounds, { padding: 100, speed: 5 });
  });

  effect(() => {
    map.getSource<GeoJSONSource>("focus")?.setData(focusLocation.value);
  });
});
