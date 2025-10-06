import { describe, it, expect, beforeEach } from 'vitest'
import { effect } from '@preact/signals-core'
import { notes, visible, focus } from '../state'
import { noteLocations, visibleLocations, focusLocation } from './map'
import type { Note } from '../db'

const note1: Note = { id: 1, time: Date.now(), text: 'Note 1', lat: 10, lon: 10 }
const note2: Note = { id: 2, time: Date.now(), text: 'Note 2', lat: 20, lon: 20 }

describe('map computed signals', () => {
  beforeEach(() => {
    notes.value = []
    visible.value = new Set()
    focus.value = -1
  })

  it('noteLocations should transform notes to GeoJSON features', () => {
    notes.value = [note1, note2]
    expect(noteLocations.value.features.length).toBe(2)
    expect(noteLocations.value.features[0].properties.id).toBe(1)
    expect(noteLocations.value.features[1].properties.id).toBe(2)
  })

  it('visibleLocations should filter notes based on visibility', () => {
    notes.value = [note1, note2]
    visible.value = new Set([1])
    expect(visibleLocations.value.features.length).toBe(1)
    expect(visibleLocations.value.features[0].properties.id).toBe(1)
  })

  it('focusLocation should filter notes based on focus', () => {
    notes.value = [note1, note2]
    focus.value = 2
    expect(focusLocation.value.features.length).toBe(1)
    expect(focusLocation.value.features[0].properties.id).toBe(2)
  })

  it('should react to state changes', () => {
    let noteCount = 0
    effect(() => {
      noteCount = noteLocations.value.features.length
    })

    notes.value = [note1]
    expect(noteCount).toBe(1)

    notes.value = [note1, note2]
    expect(noteCount).toBe(2)
  })
})