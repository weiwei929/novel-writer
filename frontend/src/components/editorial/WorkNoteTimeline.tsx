import { useCallback, useEffect, useMemo, useState } from 'react'
import { projectsApi, type WorkNote } from '../../services/api'
import WorkNoteNoteModal from './WorkNoteNoteModal'

const FIELD_LABELS: Record<string, string> = {
  origin: '缘起',
  synopsis: '梗概',
  charactersAndRelations: '人物与关系',
  timeAndPlace: '时空背景',
  eventsAndPlot: '事件与情节',
  narrativeStyle: '叙事风格',
  chapterPlanning: '章节规划',
  overview: '总述',
}

const INITIAL_BANNER = '初始快照 · 此前历史不可追溯'

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

function summarize(content: string, max = 96): string {
  const t = content.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function formatRecordedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { hour12: false })
}

export interface WorkNoteTimelineProps {
  projectId: string
  onError: (title: string, detail?: string) => void
  onSuccess: (message: string) => void
}

export default function WorkNoteTimeline({
  projectId,
  onError,
  onSuccess,
}: WorkNoteTimelineProps) {
  const [notes, setNotes] = useState<WorkNote[]>([])
  const [loading, setLoading] = useState(true)
  const [overviewDraft, setOverviewDraft] = useState('')
  const [overviewSaving, setOverviewSaving] = useState(false)
  const [active, setActive] = useState<WorkNote | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await projectsApi.listWorkNotes(projectId)
      setNotes(list)
      const ov = list.find(n => n.field === 'overview')
      setOverviewDraft(ov?.content ?? '')
    } catch (e: unknown) {
      onError('加载创作手记失败', e instanceof Error ? e.message : undefined)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [projectId, onError])

  useEffect(() => {
    void load()
  }, [load])

  const timeline = useMemo(
    () => notes.filter(n => n.field !== 'overview'),
    [notes]
  )

  const handleSaveOverview = async () => {
    setOverviewSaving(true)
    try {
      await projectsApi.upsertWorkNoteOverview(projectId, overviewDraft)
      onSuccess('总述已保存')
      await load()
    } catch (e: unknown) {
      onError('保存总述失败', e instanceof Error ? e.message : undefined)
    } finally {
      setOverviewSaving(false)
    }
  }

  const handleSaveNote = async (note: string | null) => {
    if (!active) return
    setNoteSaving(true)
    try {
      await projectsApi.updateWorkNoteNote(projectId, active.id, note)
      onSuccess('手记已保存')
      setActive(null)
      await load()
    } catch (e: unknown) {
      onError('保存手记失败', e instanceof Error ? e.message : undefined)
    } finally {
      setNoteSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-3 border-b shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">创作手记</h3>
        <p className="text-xs text-gray-500 mt-0.5">记录改了什么，补上为什么</p>
      </div>

      <div className="px-3 py-3 border-b shrink-0 space-y-2">
        <label className="text-xs font-medium text-gray-600">总述手记</label>
        <textarea
          value={overviewDraft}
          onChange={e => setOverviewDraft(e.target.value)}
          rows={4}
          placeholder="整篇作品的审阅总述（全篇一条）"
          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 resize-y min-h-[88px] focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveOverview()}
            disabled={overviewSaving}
            className="px-2.5 py-1 text-xs border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50 disabled:opacity-50"
          >
            {overviewSaving ? '保存中…' : '保存总述'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400 py-4 text-center">加载中…</p>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">暂无变更记录</p>
        ) : (
          timeline.map(entry => {
            const isInitial = entry.kind === 'initial'
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActive(entry)}
                className="w-full text-left rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 p-3 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {fieldLabel(entry.field)}
                  </span>
                  {!isInitial && (
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      edit
                    </span>
                  )}
                </div>
                {isInitial && (
                  <div className="text-xs font-medium text-amber-900 bg-amber-100 border border-amber-200 rounded px-2 py-1">
                    {INITIAL_BANNER}
                  </div>
                )}
                <p className="text-xs text-gray-600 line-clamp-3">
                  {summarize(entry.content) || '（空）'}
                </p>
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                  <span>{formatRecordedAt(entry.recordedAt)}</span>
                  <span className={entry.note?.trim() ? 'text-amber-700' : ''}>
                    {entry.note?.trim() ? '已有手记' : '点击补写'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      <WorkNoteNoteModal
        open={active != null}
        entry={active}
        fieldLabel={active ? fieldLabel(active.field) : ''}
        loading={noteSaving}
        onSave={note => void handleSaveNote(note)}
        onClose={() => {
          if (!noteSaving) setActive(null)
        }}
      />
    </div>
  )
}
