import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CycloopsForm } from './form'
import { db } from '../db'

customElements.define('cycloops-form', CycloopsForm, { extends: 'form' })

// Mock db
vi.mock('../db', () => ({
  db: {
    notes: {
      add: vi.fn(),
    },
  },
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    Promise.resolve(
      success({
        coords: {
          latitude: 50,
          longitude: 50,
        },
      })
    )
  ),
}
vi.stubGlobal('navigator', { geolocation: mockGeolocation })

describe('CycloopsForm component', () => {
  let form: CycloopsForm

  beforeEach(() => {
    document.body.innerHTML = ''
    form = document.createElement('form', { is: 'cycloops-form' }) as CycloopsForm
    form.innerHTML = '<textarea name="message"></textarea>'
    document.body.appendChild(form) // This should trigger connectedCallback
    vi.clearAllMocks()
  })

  it('should add a note on submit', async () => {
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement
    textarea.value = 'Test message'

    // The submit handler is async, so we need to wait for it to complete
    await form.submitHandler(new Event('submit'))

    expect(db.notes.add).toHaveBeenCalledOnce()
    expect(db.notes.add).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Test message',
        lat: 50,
        lon: 50,
      })
    )
  })
})