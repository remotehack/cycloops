import { describe, it, expect, beforeEach, vi } from 'vitest'
import { notes, visible } from '../state'
import { CycloopsList } from './list'
import type { Note } from '../db'

const note1: Note = { id: 1, time: Date.now() - 1000 * 60 * 5, text: 'Note 1', lat: 10, lon: 10 }
const note2: Note = { id: 2, time: Date.now(), text: 'Note 2', lat: 10.1, lon: 10.1 }

customElements.define('cycloops-list', CycloopsList, { extends: 'ol' })

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn((callback, options) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  ...options,
  callback,
}))
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver)

describe('CycloopsList component', () => {
  let list: CycloopsList

  beforeEach(() => {
    document.body.innerHTML = ''
    notes.value = []
    visible.value = new Set()
    list = new CycloopsList()
    document.body.appendChild(list)
    list.connectedCallback()
  })

  it('should render notes from the state', () => {
    notes.value = [note1, note2]
    const items = list.querySelectorAll('li.note')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('Note 1')
    expect(items[1].textContent).toBe('Note 2')
  })

  it('should render deltas between notes', () => {
    notes.value = [note1, note2]
    const delta = list.querySelector('li.delta')
    expect(delta).not.toBeNull()
    expect(delta?.textContent).toContain('5 minutes')
    expect(delta?.textContent).toContain('15.6 km')
  })

  it('should update visibility on intersection', () => {
    notes.value = [note1]
    const li = list.querySelector('li.note') as HTMLLIElement

    // Simulate intersection
    const observerInstance = mockIntersectionObserver.mock.results[0].value
    observerInstance.callback([{ target: li, isIntersecting: true }])

    expect(visible.value.has(1)).toBe(true)

    // Simulate leaving viewport
    observerInstance.callback([{ target: li, isIntersecting: false }])
    expect(visible.value.has(1)).toBe(false)
  })
})