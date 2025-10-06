import { db } from "../db";
import { featureCollection, point } from "@turf/turf";

export class CycloopsMenu extends HTMLDivElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: relative;
          display: inline-block;
        }

        button {
          border-radius: 100%;
          border: none;
          height: 42px;
          width: 42px;
          display: flex;
          padding: 0;
          justify-content: center;
          align-items: center;
          background-color: #fff;
          color: #000;
          cursor: pointer;
        }

        .dropdown {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background-color: #fff;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          z-index: 1;
          border-radius: 11px;
          overflow: hidden;
        }

        .dropdown a {
          color: #000;
          padding: 12px 16px;
          text-decoration: none;
          display: block;
        }

        .dropdown a:hover {
          background-color: #0001;
        }

        .show {
          display: block;
        }
      </style>
      <button>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
        </svg>
      </button>
      <div class="dropdown">
        <a href="#" id="export-geojson">Export as GeoJSON</a>
      </div>
    `;
  }

  connectedCallback() {
    const button = this.shadowRoot!.querySelector("button");
    const dropdown = this.shadowRoot!.querySelector(".dropdown");
    const exportLink = this.shadowRoot!.querySelector("#export-geojson");

    button?.addEventListener("click", () => {
      dropdown?.classList.toggle("show");
    });

    exportLink?.addEventListener("click", (e) => {
      e.preventDefault();
      this.exportAsGeoJSON();
      dropdown?.classList.remove("show");
    });
  }

  async exportAsGeoJSON() {
    const notes = await db.notes.toArray();
    const features = notes.map((note) =>
      point([note.lon, note.lat], {
        timestamp: note.time,
        text: note.text,
      })
    );
    const featureCollectionObject = featureCollection(features);

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(featureCollectionObject));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cycloops-notes.geojson");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}