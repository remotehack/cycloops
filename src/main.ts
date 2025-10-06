import "./style.css";

import { CycloopsForm } from "./components/form";
import { CycloopsList } from "./components/list";
import { CycloopsMap } from "./components/map";
import { CycloopsMenu } from "./components/menu";

customElements.define("cycloops-form", CycloopsForm, { extends: "form" });
customElements.define("cycloops-list", CycloopsList, { extends: "ol" });
customElements.define("cycloops-map", CycloopsMap, { extends: "div" });
customElements.define("cycloops-menu", CycloopsMenu, { extends: "div" });
