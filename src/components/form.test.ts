import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CycloopsForm } from './form'
import { db } from '../db'

customElements.define('cycloops-form', CycloopsForm, { extends: 'form' })

// Mock db
vi.mock('../db', () => ({
  db: {
    notes: {
      add: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(1),
    },
  },
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
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
    ;(db.notes.add as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(db.notes.update as ReturnType<typeof vi.fn>).mockResolvedValue(1)
  })

  it('should optimistically add a note immediately with placeholder coords', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // never resolves during this test
    })

    const textarea = form.querySelector('textarea') as HTMLTextAreaElement
    textarea.value = 'Test message'

    await form.submitHandler(new Event('submit'))

    expect(db.notes.add).toHaveBeenCalledOnce()
    expect(db.notes.add).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Test message', lat: 0, lon: 0 })
    )
  })

  it('should update coords after geolocation resolves', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 50, longitude: 50 } } as GeolocationPosition)
    )

    const textarea = form.querySelector('textarea') as HTMLTextAreaElement
    textarea.value = 'Test message'

    await form.submitHandler(new Event('submit'))

    expect(db.notes.update).toHaveBeenCalledWith(1, { lat: 50, lon: 50 })
  })

  it('should not add a note when message is whitespace only', async () => {
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement
    textarea.value = '   '

    await form.submitHandler(new Event('submit'))

    expect(db.notes.add).not.toHaveBeenCalled()
  })

  it('should not add a note when message is blank', async () => {
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement
    textarea.value = ''

    await form.submitHandler(new Event('submit'))

    expect(db.notes.add).not.toHaveBeenCalled()
  })
})