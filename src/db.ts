import Dexie, { liveQuery, type EntityTable } from "dexie";
import { notes } from "./state";

export interface Note {
  id: number;
  time: number;
  text: string;
  lat: number;
  lon: number;
}

export const db = new Dexie("Cycleoops") as Dexie & {
  notes: EntityTable<Note, "id">;
};

// Declare tables, IDs and indexes
db.version(1).stores({
  notes: "++id, time, text, lat, lon",
});

// populate note state from dexie
const query = liveQuery(() => db.notes.orderBy("time").reverse().toArray());
query.subscribe({
  next(value) {
    notes.value = value;
  },
  error(err) {
    console.error(err);
  },
});
