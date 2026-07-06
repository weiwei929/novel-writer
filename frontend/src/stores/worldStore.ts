import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  worldApi,
  type WorldScope,
  type WorldCharacter,
  type TimelineEntry,
  type CreativeFlow,
} from '../services/api'

type WorldModule = 'characters' | 'timeline' | 'flows'

interface WorldState {
  // 当前作品设定数据的归属：提案（proposalId）或项目（projectId）
  currentScope: WorldScope | null
  characters: WorldCharacter[]
  timelineEntries: TimelineEntry[]
  flows: CreativeFlow[]
  loading: boolean
  error: string | null
}

interface WorldActions {
  setCurrentScope: (scope: WorldScope | null) => void
  loadAll: () => Promise<void>
  reload: (module: WorldModule) => Promise<void>
  reset: () => void
}

const initialState: WorldState = {
  currentScope: null,
  characters: [],
  timelineEntries: [],
  flows: [],
  loading: false,
  error: null,
}

export const useWorldStore = create<WorldState & WorldActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentScope: scope => {
        const prev = get().currentScope
        // 切换归属时清空旧数据，避免串台
        if (!scope) {
          set({ currentScope: null, characters: [], timelineEntries: [], flows: [] }, false, 'clearScope')
          return
        }
        if (prev && prev.type === scope.type && prev.id === scope.id) {
          set({ currentScope: scope }, false, 'setCurrentScope/same')
        } else {
          set(
            { currentScope: scope, characters: [], timelineEntries: [], flows: [] },
            false,
            'setCurrentScope'
          )
        }
        void get().loadAll()
      },

      loadAll: async () => {
        const scope = get().currentScope
        if (!scope) return
        set({ loading: true, error: null }, false, 'loadAll/start')
        try {
          const [characters, timelineEntries, flows] = await Promise.all([
            worldApi.chars.list(scope),
            worldApi.timeline.list(scope),
            worldApi.flows.list(scope),
          ])
          set({ characters, timelineEntries, flows, loading: false }, false, 'loadAll/success')
        } catch (e: any) {
          set({ loading: false, error: e?.message || '加载作品设定失败' }, false, 'loadAll/error')
        }
      },

      reload: async module => {
        const scope = get().currentScope
        if (!scope) return
        try {
          if (module === 'characters') {
            set({ characters: await worldApi.chars.list(scope) }, false, 'reload/characters')
          } else if (module === 'timeline') {
            set({ timelineEntries: await worldApi.timeline.list(scope) }, false, 'reload/timeline')
          } else {
            set({ flows: await worldApi.flows.list(scope) }, false, 'reload/flows')
          }
        } catch (e: any) {
          set({ error: e?.message || '刷新数据失败' }, false, 'reload/error')
        }
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'WorldStore' }
  )
)
