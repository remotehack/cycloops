import { signal } from "@preact/signals-core";
import { type Note } from "./db";

export const notes = signal<Note[]>([]);
export const visible = signal(new Set<number>());
export const focus = signal<number>(-1);
