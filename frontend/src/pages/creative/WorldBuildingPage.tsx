import { useState } from 'react'
import CharactersPanel from '../../components/world/CharactersPanel'
import TimelinePanel from '../../components/world/TimelinePanel'
import CreativeFlowPanel from '../../components/world/CreativeFlowPanel'

type Tab = 'characters' | 'timeline' | 'flows'

const TABS: { id: Tab; label: string }[] = [
  { id: 'characters', label: '人物设定' },
  { id: 'timeline', label: '故事线' },
  { id: 'flows', label: '创作心流' },
]

// 作品设定区块（可嵌入提案详情页 / 评估页）。归属由外层通过 worldStore.setCurrentScope 设置。
// 内部三个 Tab 切换不改变 URL。readOnly 时三面板隐藏所有写操作。
export default function WorldBuildingPage({ readOnly = false }: { readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>('characters')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'characters' ? (
        <CharactersPanel readOnly={readOnly} />
      ) : activeTab === 'timeline' ? (
        <TimelinePanel readOnly={readOnly} />
      ) : (
        <CreativeFlowPanel readOnly={readOnly} />
      )}
    </div>
  )
}
