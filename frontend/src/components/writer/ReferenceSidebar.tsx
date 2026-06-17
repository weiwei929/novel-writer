import { useEffect, useState } from 'react'
import {
  workApi,
  type WorldCharacter,
  type TimelineEntry,
  type CreativeFlow,
} from '../../services/api'
import {
  WORK_SETTING_BLOCKS,
  hasAnyWorkSettingContent,
  type WorkSetting,
} from '../../services/workSetting'

type RefTab = 'setting' | 'chapter'

interface ReferenceSidebarProps {
  projectId: string
  width?: number
  /** 616-D-B：企划 workSetting，由写作页传入，只读展示 */
  workSetting?: WorkSetting
  /** 616-D-B：当前章梗概（materialize 后的 Chapter.summary） */
  chapterSummary?: string
  chapterLabel?: string
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim()
  return (
    <div className="border border-gray-100 rounded-lg p-2.5">
      <div className="text-xs font-medium text-gray-700">{label}</div>
      {trimmed ? (
        <pre className="mt-1.5 text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
          {trimmed}
        </pre>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400">未填写</p>
      )}
    </div>
  )
}

function LegacySectionTitle({ children }: { children: string }) {
  return (
    <h4 className="text-xs font-semibold text-gray-600 mt-3 mb-1.5 first:mt-0">{children}</h4>
  )
}

export default function ReferenceSidebar({
  projectId,
  width = 280,
  workSetting,
  chapterSummary,
  chapterLabel,
}: ReferenceSidebarProps) {
  const [activeTab, setActiveTab] = useState<RefTab>('setting')
  const [legacyOpen, setLegacyOpen] = useState(false)
  const [loadingLegacy, setLoadingLegacy] = useState(true)
  const [legacyError, setLegacyError] = useState<string | null>(null)
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [creativeFlows, setCreativeFlows] = useState<CreativeFlow[]>([])
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null)
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingLegacy(true)
      setLegacyError(null)
      try {
        const data = await workApi.getDetail(projectId)
        if (cancelled) return
        setCharacters(data.characters)
        setTimelineEntries(data.timelineEntries)
        setCreativeFlows(data.creativeFlows)
      } catch {
        if (!cancelled) setLegacyError('加载遗留参考失败')
      } finally {
        if (!cancelled) setLoadingLegacy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const tabs: { id: RefTab; label: string }[] = [
    { id: 'setting', label: '设定' },
    { id: 'chapter', label: '本章' },
  ]

  const setting = workSetting
  const hasSetting = setting ? hasAnyWorkSettingContent(setting) : false
  const summaryText = chapterSummary?.trim() ?? ''

  const hasLegacyData =
    !loadingLegacy &&
    !legacyError &&
    (characters.length > 0 || timelineEntries.length > 0 || creativeFlows.length > 0)

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

      <div className="flex-1 overflow-y-auto p-3 text-sm min-h-0">
        {activeTab === 'setting' && (
          <div className="space-y-2">
            {!hasSetting ? (
              <p className="text-gray-400 text-xs text-center py-6">暂无作品设定</p>
            ) : (
              WORK_SETTING_BLOCKS.map(block => (
                <ReadOnlyBlock
                  key={block.key}
                  label={block.label}
                  value={setting![block.key]}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'chapter' && (
          <div>
            {chapterLabel && (
              <div className="text-xs font-medium text-gray-800 mb-2">{chapterLabel}</div>
            )}
            {summaryText ? (
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100 rounded-lg p-2.5">
                {summaryText}
              </pre>
            ) : (
              <p className="text-gray-400 text-xs text-center py-6">暂无本章梗概</p>
            )}
          </div>
        )}
      </div>

      {hasLegacyData && (
        <div className="border-t border-gray-100 shrink-0 bg-gray-50/80">
          <button
            type="button"
            onClick={() => setLegacyOpen(open => !open)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100/80 transition-colors"
          >
            <span className="text-xs font-medium text-gray-600">遗留参考（只读）</span>
            <span className="text-xs text-gray-400">{legacyOpen ? '收起' : '展开'}</span>
          </button>

          {legacyOpen && (
            <div className="px-3 pb-3 max-h-48 overflow-y-auto border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed pt-2">
                这些资料来自旧版世界观模块，已冻结，仅供参考。
              </p>

              {characters.length > 0 && (
                <div>
                  <LegacySectionTitle>人物</LegacySectionTitle>
                  <div className="space-y-2">
                    {characters.map(c => {
                      const expanded = expandedCharId === c.id
                      const desc = c.personality || c.identity || c.appearance || ''
                      return (
                        <div key={c.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                          <button
                            type="button"
                            className="w-full flex items-start gap-2 text-left"
                            onClick={() => setExpandedCharId(expanded ? null : c.id)}
                          >
                            <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium shrink-0">
                              {c.name.charAt(0)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-800 text-xs truncate">{c.name}</div>
                              {c.roleType && (
                                <div className="text-xs text-gray-500">{c.roleType}</div>
                              )}
                              {!expanded && desc && (
                                <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{desc}</div>
                              )}
                            </div>
                          </button>
                          {expanded && (
                            <div className="mt-2 pl-9 space-y-1 text-xs text-gray-600">
                              {c.gender && <div>性别：{c.gender}</div>}
                              {c.identity && <div>身份：{c.identity}</div>}
                              {c.personality && <div>性格：{c.personality}</div>}
                              {c.appearance && <div>外貌：{c.appearance}</div>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {timelineEntries.length > 0 && (
                <div>
                  <LegacySectionTitle>故事线</LegacySectionTitle>
                  <div className="space-y-2">
                    {[...timelineEntries]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(entry => (
                        <div key={entry.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                          <div className="text-xs text-gray-500">
                            {entry.time} · {entry.location}
                          </div>
                          <div className="text-xs font-medium text-gray-800 mt-1">{entry.characters}</div>
                          {entry.premise && (
                            <div className="text-xs text-gray-600 mt-1">起因：{entry.premise}</div>
                          )}
                          {entry.outcome && (
                            <div className="text-xs text-gray-600 mt-0.5">结果：{entry.outcome}</div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {creativeFlows.length > 0 && (
                <div>
                  <LegacySectionTitle>心流</LegacySectionTitle>
                  <div className="space-y-2">
                    {creativeFlows.map(flow => {
                      const expanded = expandedFlowId === flow.id
                      return (
                        <div key={flow.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setExpandedFlowId(expanded ? null : flow.id)}
                          >
                            <div className="font-medium text-gray-800 text-xs">{flow.title}</div>
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
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
