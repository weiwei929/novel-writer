import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  worldApi,
  type WorldCharacter,
  type TimelineEntry,
  type CreativeFlow,
} from '../services/api'

type WorldModule = 'characters' | 'timeline' | 'flows'

interface WorldState {
  currentProjectId: string | null
  characters: WorldCharacter[]
  timelineEntries: TimelineEntry[]
  flows: CreativeFlow[]
  loading: boolean
  error: string | null
}

interface WorldActions {
  setCurrentProjectId: (id: string | null) => void
  loadAll: () => Promise<void>
  reload: (module: WorldModule) => Promise<void>
  reset: () => void
}

const initialState: WorldState = {
  currentProjectId: null,
  characters: [],
  timelineEntries: [],
  flows: [],
  loading: false,
  error: null,
}

export const useWorldStore = create<WorldState & WorldActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentProjectId: id => {
          set({ currentProjectId: id }, false, 'setCurrentProjectId')
          if (id) {
            void get().loadAll()
          } else {
            set({ characters: [], timelineEntries: [], flows: [] }, false, 'clearLists')
          }
        },

        loadAll: async () => {
          const projectId = get().currentProjectId
          if (!projectId) return
          set({ loading: true, error: null }, false, 'loadAll/start')
          try {
            const [characters, timelineEntries, flows] = await Promise.all([
              worldApi.chars.list(projectId),
              worldApi.timeline.list(projectId),
              worldApi.flows.list(projectId),
            ])
            set({ characters, timelineEntries, flows, loading: false }, false, 'loadAll/success')
          } catch (e: any) {
            set(
              { loading: false, error: e?.message || '加载世界观数据失败' },
              false,
              'loadAll/error'
            )
          }
        },

        reload: async module => {
          const projectId = get().currentProjectId
          if (!projectId) return
          try {
            if (module === 'characters') {
              set({ characters: await worldApi.chars.list(projectId) }, false, 'reload/characters')
            } else if (module === 'timeline') {
              set(
                { timelineEntries: await worldApi.timeline.list(projectId) },
                false,
                'reload/timeline'
              )
            } else {
              set({ flows: await worldApi.flows.list(projectId) }, false, 'reload/flows')
            }
          } catch (e: any) {
            set({ error: e?.message || '刷新数据失败' }, false, 'reload/error')
          }
        },

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'world-storage',
        partialize: state => ({ currentProjectId: state.currentProjectId }),
      }
    ),
    { name: 'WorldStore' }
  )
)
