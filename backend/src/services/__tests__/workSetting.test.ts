import { describe, it, expect } from '@jest/globals'

interface WorkSetting {
  charactersAndRelations: string
  timeAndPlace: string
  eventsAndPlot: string
  narrativeStyle: string
}

function countRequiredBlocksFilledLogic(ws: Partial<WorkSetting>): number {
  let count = 0
  if (typeof ws.charactersAndRelations === 'string' && ws.charactersAndRelations.trim()) count++
  if (typeof ws.timeAndPlace === 'string' && ws.timeAndPlace.trim()) count++
  if (typeof ws.eventsAndPlot === 'string' && ws.eventsAndPlot.trim()) count++
  return count
}

describe('workSetting normalization and required blocks counter', () => {
  it('correctly counts required blocks filled from 0 to 3', () => {
    expect(countRequiredBlocksFilledLogic({})).toBe(0)
    expect(
      countRequiredBlocksFilledLogic({
        charactersAndRelations: 'Hero & Villain',
      })
    ).toBe(1)
    expect(
      countRequiredBlocksFilledLogic({
        charactersAndRelations: 'Hero & Villain',
        timeAndPlace: 'Ancient China',
      })
    ).toBe(2)
    expect(
      countRequiredBlocksFilledLogic({
        charactersAndRelations: 'Hero & Villain',
        timeAndPlace: 'Ancient China',
        eventsAndPlot: 'Revenge arc',
      })
    ).toBe(3)
  })

  it('ignores optional narrativeStyle in required count', () => {
    expect(
      countRequiredBlocksFilledLogic({
        narrativeStyle: 'First-person perspective',
      })
    ).toBe(0)
  })
})
