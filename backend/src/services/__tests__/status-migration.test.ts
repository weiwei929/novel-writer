import { describe, it, expect } from '@jest/globals'
import {
  PROJECT_STATUS_MAP,
  PROPOSAL_STATUS_MAP,
  mapProjectStatus,
  mapProposalStatus,
  withMappedProjectStatus,
  withMappedProposalStatus,
} from '../status-migration'

describe('status-migration service', () => {
  describe('Project Status Mapping', () => {
    it('maps draft status to planning', () => {
      expect(mapProjectStatus('draft')).toBe('planning')
    })

    it('maps trashed and pooled status to shelved', () => {
      expect(mapProjectStatus('trashed')).toBe('shelved')
      expect(mapProjectStatus('pooled')).toBe('shelved')
    })

    it('maps published and completed to reviewed', () => {
      expect(mapProjectStatus('published')).toBe('reviewed')
      expect(mapProjectStatus('completed')).toBe('reviewed')
    })

    it('returns original status when unmapped (e.g., writing)', () => {
      expect(mapProjectStatus('writing')).toBe('writing')
      expect(mapProjectStatus('unknown_status')).toBe('unknown_status')
    })

    it('transforms project object status with withMappedProjectStatus', () => {
      const draftProject = { id: 'p-1', name: 'Test Draft', status: 'draft' }
      const mapped = withMappedProjectStatus(draftProject)
      expect(mapped.status).toBe('planning')
      expect(mapped.name).toBe('Test Draft')
    })
  })

  describe('Proposal Status Mapping', () => {
    it('maps draft to creating', () => {
      expect(mapProposalStatus('draft')).toBe('creating')
    })

    it('maps submitted and evaluated to created', () => {
      expect(mapProposalStatus('submitted')).toBe('created')
      expect(mapProposalStatus('evaluated')).toBe('created')
    })

    it('transforms proposal object status with withMappedProposalStatus', () => {
      const proposal = { id: 'prop-1', title: 'Test Proposal', status: 'draft' }
      const mapped = withMappedProposalStatus(proposal)
      expect(mapped.status).toBe('creating')
    })
  })
})
