import { describe, it, expect, jest } from '@jest/globals'
import { z } from 'zod'
import { acceptIntoPlanningCore } from '../proposals'
import { UpdateProjectSchema } from '../projects'

jest.mock('../../utils/workNote', () => ({
  buildOriginContent: () => 'origin snapshot',
  extractTrackedFields: () => ({}),
  recordWorkNoteDiff: jest.fn(async () => 0),
}))

/** Mirror backend PROPOSAL_STATUSES — must include formed for 720 */
const PROPOSAL_STATUSES = [
  'draft',
  'submitted',
  'evaluated',
  'approved',
  'rejected',
  'shelved',
  'formed',
] as const

describe('Wave 6 handoff contract', () => {
  it('strips project status from generic PATCH body (client cannot change status)', () => {
    const result = UpdateProjectSchema.safeParse({ title: '作品 A', status: 'writing' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toEqual({ title: '作品 A' })
    expect(result.data).not.toHaveProperty('status')
  })

  it('accepts formed as a proposal status enum member', () => {
    const schema = z.object({ status: z.enum(PROPOSAL_STATUSES) })
    expect(schema.safeParse({ status: 'formed' }).success).toBe(true)
  })

  it('acceptIntoPlanningCore copies proposal.references to project metadata attachedReferences', async () => {
    let capturedMetadata: Record<string, unknown> | undefined
    const tx = {
      project: {
        create: jest.fn(async ({ data }: { data: { metadata: Record<string, unknown> } }) => {
          capturedMetadata = data.metadata
          return { id: 'proj-1', title: data.metadata, status: 'planning' }
        }),
      },
      character: { updateMany: jest.fn(async () => ({ count: 0 })) },
      timelineEntry: { updateMany: jest.fn(async () => ({ count: 0 })) },
      creativeFlow: { updateMany: jest.fn(async () => ({ count: 0 })) },
      proposal: {
        update: jest.fn(async () => ({ id: 'prop-1', status: 'approved' })),
      },
    }

    await acceptIntoPlanningCore(tx as never, {
      id: 'prop-1',
      title: '测试提案',
      synopsis: '梗概',
      references: [{ type: 'scrap' as const, id: 'scrap-1', title: '素材' }],
      metadata: {},
    })

    expect(capturedMetadata?.attachedReferences).toEqual([
      { type: 'scrap', id: 'scrap-1', title: '素材' },
    ])
  })
})
