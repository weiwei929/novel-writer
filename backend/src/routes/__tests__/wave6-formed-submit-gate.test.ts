import { describe, it, expect } from '@jest/globals'
import { validateProposalStatusUpdate } from '../proposals'

describe('validateProposalStatusUpdate — formed gate for planning handoff', () => {
  it('rejects draft -> submitted', () => {
    const result = validateProposalStatusUpdate('draft', 'submitted')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/formed/i)
  })

  it('rejects creating -> submitted', () => {
    expect(validateProposalStatusUpdate('creating', 'submitted').ok).toBe(false)
  })

  it('rejects evaluated -> submitted', () => {
    expect(validateProposalStatusUpdate('evaluated', 'submitted').ok).toBe(false)
  })

  it('allows formed -> submitted', () => {
    expect(validateProposalStatusUpdate('formed', 'submitted')).toEqual({ ok: true })
  })

  it('allows submitted -> draft (local recovery path)', () => {
    expect(validateProposalStatusUpdate('submitted', 'draft')).toEqual({ ok: true })
  })

  it('does not gate non-submitted targets', () => {
    expect(validateProposalStatusUpdate('draft', 'formed')).toEqual({ ok: true })
  })
})
