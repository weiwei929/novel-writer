import { useEffect, useState } from 'react'
import {
  workApi,
  type WorldCharacter,
  type TimelineEntry,
  type CreativeFlow,
} from '../../services/api'

type RefTab = 'characters' | 'timeline' | 'flows'

interface ReferenceSidebarProps {
  projectId: string
  width?: number
}

export default function ReferenceSidebar({ projectId, width = 280 }: ReferenceSidebarProps) {
  const [activeTab, setActiveTab] = useState<RefTab>('characters')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [creativeFlows, setCreativeFlows] = useState<CreativeFlow[]>([])
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null)
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await workApi.getDetail(projectId)
        if (cancelled) return
        setCharacters(data.characters)
        setTimelineEntries(data.timelineEntries)
        setCreativeFlows(data.creativeFlows)
      } catch {
        if (!cancelled) setError('加载参考数据失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const tabs: { id: RefTab; label: string }[] = [
    { id: 'characters', label: '人物' },
    { id: 'timeline', label: '故事线' },
    { id: 'flows', label: '心流' },
  ]

  return (
    <div
      className="flex flex-col h-full bg-white border-l border-gray-200 shrink-0 overflow-hidden"
      style={{ width }}
    >
      <div className="px-3 py-2 border-b border-gray-100 shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">写作参考</h3>
        <p className="text-xs text-gray-400 mt-0.5">只读参考</p>
      </div>

      <div className="flex border-b border-gray-100 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'text-blue-700 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {loading && <p className="text-gray-400 text-center py-8">加载中...</p>}
        {error && <p className="text-red-500 text-center py-8">{error}</p>}

        {!loading && !error && activeTab === 'characters' && (
          <div className="space-y-2">
            {characters.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">暂无人物设定</p>
            ) : (
              characters.map(c => {
                const expanded = expandedCharId === c.id
                const desc = c.personality || c.identity || c.appearance || ''
                return (
                  <div key={c.id} className="border border-gray-100 rounded-lg p-2">
                    <button
                      type="button"
                      className="w-full flex items-start gap-2 text-left"
                      onClick={() => setExpandedCharId(expanded ? null : c.id)}
                    >
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
                        {c.name.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{c.name}</div>
                        {c.roleType && (
                          <div className="text-xs text-blue-600">{c.roleType}</div>
                        )}
                        {!expanded && desc && (
                          <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{desc}</div>
                        )}
                      </div>
                    </button>
                    {expanded && (
                      <div className="mt-2 pl-10 space-y-1 text-xs text-gray-600">
                        {c.gender && <div>性别：{c.gender}</div>}
                        {c.identity && <div>身份：{c.identity}</div>}
                        {c.personality && <div>性格：{c.personality}</div>}
                        {c.appearance && <div>外貌：{c.appearance}</div>}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'timeline' && (
          <div className="space-y-3">
            {timelineEntries.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">暂无故事线</p>
            ) : (
              [...timelineEntries]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(entry => (
                  <div key={entry.id} className="border border-gray-100 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500">
                      {entry.time} · {entry.location}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{entry.characters}</div>
                    {entry.premise && (
                      <div className="text-xs text-gray-600 mt-1">起因：{entry.premise}</div>
                    )}
                    {entry.outcome && (
                      <div className="text-xs text-gray-600 mt-0.5">结果：{entry.outcome}</div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'flows' && (
          <div className="space-y-2">
            {creativeFlows.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">暂无创作心流</p>
            ) : (
              creativeFlows.map(flow => {
                const expanded = expandedFlowId === flow.id
                return (
                  <div key={flow.id} className="border border-gray-100 rounded-lg p-2">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setExpandedFlowId(expanded ? null : flow.id)}
                    >
                      <div className="font-medium text-gray-900 text-sm">{flow.title}</div>
                      {!expanded && (
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1 whitespace-pre-wrap">
                          {flow.content}
                        </div>
                      )}
                    </button>
                    {expanded && (
                      <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-sans">
                        {flow.content}
                      </pre>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
