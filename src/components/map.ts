import { computed, effect } from "@preact/signals-core";
import { bbox } from "@turf/turf";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { notes, visible, focus } from "../state";

type Locations = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { id: number; text: string }
>;

export const noteLocations = computed<Locations>(() => ({
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

export const visibleLocations = computed<Locations>(() => {
  const all = noteLocations.value;

  const features = all.features.filter((p) =>
    visible.value.has(p.properties.id)
  );

  return { ...all, features };
});

export const focusLocation = computed<Locations>(() => {
  const all = noteLocations.value;

  const features = all.features.filter((p) => p.properties.id === focus.value);

  return { ...all, features };
});

export class CycloopsMap extends HTMLDivElement {
  connectedCallback() {
    console.log("connected map", this);

    this.style.position = "fixed";
    this.style.left =
      this.style.top =
      this.style.right =
      this.style.bottom =
        "0";
    this.style.zIndex = "-1";

    const map = new maplibregl.Map({
      container: this,
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
  }
}
