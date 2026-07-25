import React, { useEffect, useState } from 'react'
import {
  projectsApi,
  chaptersApi,
  Chapter,
  ChapterPlanItem,
} from '../../services/api'
import {
  normalizeChapterPlanning,
  legacyPlansToCanonical,
  toLegacyChapterPlanItems,
  type ChapterPlanningItem as CanonicalChapterPlanningItem,
} from '../../services/chapterPlanning'
import { useNotifications } from '../../hooks/useNotifications'
import { IconArrowDown, IconArrowUp, IconCopy, IconDelete, IconPlus } from '../ui/icons'

type PlanStatus = 'planned' | 'started' | 'completed'

interface WorkChapterEditorProps {
  projectId: string
  initialPlans: ChapterPlanItem[] | CanonicalChapterPlanningItem[]
  onClose: () => void
  onSaved?: (plans: ChapterPlanItem[] | CanonicalChapterPlanningItem[]) => void
  /** 企划课路径：创建 canonical 规划，不写 chapters 表 */
  planningMode?: boolean
  /** 2.0 内嵌流式文档模式（无遮罩侧滑抽屉），默认为 true */
  inlineMode?: boolean
}

const emptyLegacyPlan = (nextOrder: number): ChapterPlanItem => ({
  id: Math.random().toString(36).slice(2),
  order: nextOrder,
  title: `第${nextOrder}章（待定）`,
  plannedLength: 2000,
  synopsisText: '',
  status: 'planned',
})

const emptyPlanningPlan = (nextOrder: number): CanonicalChapterPlanningItem => ({
  order: nextOrder,
  title: `第${nextOrder}章（待定）`,
  summary: '',
})

const WorkChapterEditor: React.FC<WorkChapterEditorProps> = ({
  projectId,
  initialPlans = [],
  onClose,
  onSaved,
  planningMode = false,
  inlineMode = true,
}) => {
  const { success, error: notifyError, warning } = useNotifications()
  const [legacyPlans, setLegacyPlans] = useState<ChapterPlanItem[]>(() =>
    toLegacyChapterPlanItems(initialPlans)
  )
  const [planningPlans, setPlanningPlans] = useState<CanonicalChapterPlanningItem[]>(() =>
    normalizeChapterPlanning(initialPlans)
  )
  const [saving, setSaving] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])

  const updateLegacyPlan = (index: number, patch: Partial<ChapterPlanItem>) => {
    setLegacyPlans(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const updatePlanningPlan = (index: number, patch: Partial<CanonicalChapterPlanningItem>) => {
    setPlanningPlans(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const reorderLegacy = (arr: ChapterPlanItem[]) => arr.map((p, i) => ({ ...p, order: i + 1 }))
  const reorderPlanning = (arr: CanonicalChapterPlanningItem[]) =>
    arr.map((p, i) => ({ ...p, order: i + 1 }))

  const addPlan = () => {
    if (planningMode) {
      setPlanningPlans(prev => [...prev, emptyPlanningPlan(prev.length + 1)])
      return
    }
    setLegacyPlans(prev => [...prev, emptyLegacyPlan(prev.length + 1)])
  }

  const duplicatePlan = (index: number) => {
    if (planningMode) {
      const src = planningPlans[index]
      const dup: CanonicalChapterPlanningItem = {
        ...src,
        title: src.title + '（副本）',
      }
      const next = [...planningPlans]
      next.splice(index + 1, 0, dup)
      setPlanningPlans(reorderPlanning(next))
      return
    }
    const src = legacyPlans[index]
    const dup: ChapterPlanItem = {
      ...src,
      id: Math.random().toString(36).slice(2),
      title: src.title + '（副本）',
    }
    const next = [...legacyPlans]
    next.splice(index + 1, 0, dup)
    setLegacyPlans(reorderLegacy(next))
  }

  const deletePlan = (index: number) => {
    if (planningMode) {
      setPlanningPlans(reorderPlanning(planningPlans.filter((_, i) => i !== index)))
      return
    }
    setLegacyPlans(reorderLegacy(legacyPlans.filter((_, i) => i !== index)))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    if (planningMode) {
      const next = [...planningPlans]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      setPlanningPlans(reorderPlanning(next))
      return
    }
    const next = [...legacyPlans]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setLegacyPlans(reorderLegacy(next))
  }

  const moveDown = (index: number) => {
    const len = planningMode ? planningPlans.length : legacyPlans.length
    if (index === len - 1) return
    if (planningMode) {
      const next = [...planningPlans]
      ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
      setPlanningPlans(reorderPlanning(next))
      return
    }
    const next = [...legacyPlans]
    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
    setLegacyPlans(reorderLegacy(next))
  }

  useEffect(() => {
    if (planningMode) return
    ;(async () => {
      try {
        const list = await chaptersApi.getByProjectId(projectId)
        setChapters(list)
        if (initialPlans.length === 0 && list.length > 0) {
          const drafts: ChapterPlanItem[] = list
            .sort((a, b) => a.order - b.order)
            .map(c => ({
              id: Math.random().toString(36).slice(2),
              order: c.order,
              title: c.title || `第${c.order}章`,
              plannedLength: c.wordCount || 2000,
              synopsisText: c.summary || '',
              status: 'planned',
            }))
          setLegacyPlans(drafts)
        }
      } catch {
        // ignore
      }
    })()
  }, [projectId, initialPlans.length, planningMode])

  const savePlanning = async () => {
    const payload = normalizeChapterPlanning(reorderPlanning(planningPlans))
    const invalidTitle = payload.find(p => !p.title.trim())
    if (invalidTitle) {
      warning('校验失败', '存在标题为空的规划项，请补全后再保存')
      return
    }
    const invalidSummary = payload.find(p => !p.summary.trim())
    if (invalidSummary) {
      warning('校验失败', '存在梗概为空的规划项，请补全后再保存')
      return
    }
    const saved = await projectsApi.updateChapterPlanning(projectId, payload)
    success('章节规划已保存')
    onSaved?.(saved)
    onClose()
  }

  const saveLegacy = async () => {
    const invalid = legacyPlans.find(p => !p.title || !p.title.trim())
    if (invalid) {
      warning('校验失败', '存在标题为空的规划项，请补全后再保存')
      return
    }
    const payload = reorderLegacy(legacyPlans)
    const saved = await projectsApi.updateChapterPlanning(
      projectId,
      legacyPlansToCanonical(payload)
    )
    try {
      const existing = await chaptersApi.getByProjectId(projectId)
      const byOrder = new Map(existing.map(c => [c.order, c]))
      for (const p of payload) {
        const mappedStatus =
          p.status === 'planned'
            ? 'draft'
            : p.status === 'started'
              ? 'writing'
              : p.status === 'completed'
                ? 'completed'
                : undefined
        const at = byOrder.get(p.order)
        if (!at) {
          const created = await chaptersApi.createForProject(projectId, {
            title: p.title,
            order: p.order,
            content: '',
          })
          if (mappedStatus || p.synopsisText) {
            await chaptersApi.update(created.id, {
              status: (mappedStatus as Chapter['status']) || created.status,
              summary: p.synopsisText || created.summary,
            })
          }
        } else {
          const patch: Partial<Chapter> = {}
          if (p.title && p.title !== at.title) patch.title = p.title
          if ((p.synopsisText || '') !== (at.summary || '')) patch.summary = p.synopsisText
          if (mappedStatus && mappedStatus !== at.status) patch.status = mappedStatus as Chapter['status']
          if (Object.keys(patch).length > 0) {
            await chaptersApi.update(at.id, patch)
          }
        }
      }
    } catch (syncErr) {
      console.warn('章节同步未完成（不影响规划保存）：', syncErr)
    }
    success('作品章节已保存')
    onSaved?.(saved)
    onClose()
  }

  const save = async () => {
    try {
      setSaving(true)
      if (planningMode) {
        await savePlanning()
      } else {
        await saveLegacy()
      }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : '请稍后重试'
      notifyError(planningMode ? '保存章节规划失败' : '保存作品章节失败', message)
    } finally {
      setSaving(false)
    }
  }

  const plans = planningMode ? planningPlans : legacyPlans

  const content = (
    <div className={`space-y-4 font-sans ${inlineMode ? '' : 'flex flex-col h-full'}`}>
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {planningMode ? '章节规划大纲' : '作品章节'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {planningMode
              ? '企划阶段：全页面内嵌编辑章节顺序、标题与梗概'
              : '结构化编辑章节顺序、标题、预计字数、梗概与状态'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addPlan}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <IconPlus className="w-3.5 h-3.5" /> 新增章节
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg shadow-xs transition-all"
          >
            {saving ? '保存中…' : '保存章节规划'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </div>

      <div className={`space-y-3 ${inlineMode ? '' : 'flex-1 overflow-auto p-4 bg-gray-50'}`}>
          {!planningMode && chapters.length > 0 && (
            <div className="bg-white rounded border p-3">
              <div className="font-medium text-gray-900 mb-2">现有章节</div>
              <div className="grid grid-cols-12 gap-2 text-xs">
                {[...chapters]
                  .sort((a, b) => a.order - b.order)
                  .map(c => (
                    <div key={c.id} className="col-span-6 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded">第 {c.order} 章</span>
                      <span className="truncate">{c.title || `第${c.order}章`}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {plans.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-10">
              {planningMode
                ? '暂无章节规划，点击「新增」开始'
                : '暂无规划项，点击“新增”开始'}
            </div>
          )}
          {planningMode
            ? planningPlans.map((p, idx) => (
                <div key={`plan-${p.order}-${idx}`} className="bg-white rounded border shadow-sm p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <button
                        onClick={() => moveUp(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="上移"
                      >
                        <IconArrowUp className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-gray-500 w-8 text-center">{p.order}</div>
                      <button
                        onClick={() => moveDown(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="下移"
                      >
                        <IconArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-3">
                      <div className="col-span-12">
                        <label className="block text-xs text-gray-600 mb-1">标题</label>
                        <input
                          value={p.title}
                          onChange={e => updatePlanningPlan(idx, { title: e.target.value })}
                          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-12">
                        <label className="block text-xs text-gray-600 mb-1">章节梗概</label>
                        <textarea
                          value={p.summary}
                          onChange={e => updatePlanningPlan(idx, { summary: e.target.value })}
                          placeholder="简述本章的核心推进与要点"
                          className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <button
                        onClick={() => duplicatePlan(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="复制"
                      >
                        <IconCopy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePlan(idx)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                        title="删除"
                      >
                        <IconDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            : legacyPlans.map((p, idx) => (
                <div key={p.id} className="bg-white rounded border shadow-sm p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <button
                        onClick={() => moveUp(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="上移"
                      >
                        <IconArrowUp className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-gray-500 w-8 text-center">{p.order}</div>
                      <button
                        onClick={() => moveDown(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="下移"
                      >
                        <IconArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-3">
                      <div className="col-span-7">
                        <label className="block text-xs text-gray-600 mb-1">标题</label>
                        <input
                          value={p.title}
                          onChange={e => updateLegacyPlan(idx, { title: e.target.value })}
                          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">预计字数</label>
                        <input
                          type="number"
                          min={0}
                          value={p.plannedLength}
                          onChange={e =>
                            updateLegacyPlan(idx, { plannedLength: Number(e.target.value || 0) })
                          }
                          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">状态</label>
                        <select
                          value={p.status}
                          onChange={e => updateLegacyPlan(idx, { status: e.target.value as PlanStatus })}
                          className="w-full px-2 py-1 border rounded bg-white"
                        >
                          <option value="planned">计划中</option>
                          <option value="started">进行中</option>
                          <option value="completed">已完成</option>
                        </select>
                      </div>
                      <div className="col-span-12">
                        <label className="block text-xs text-gray-600 mb-1">章节梗概</label>
                        <textarea
                          value={p.synopsisText || ''}
                          onChange={e => updateLegacyPlan(idx, { synopsisText: e.target.value })}
                          placeholder="简述本章的核心推进与要点"
                          className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <button
                        onClick={() => duplicatePlan(idx)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="复制"
                      >
                        <IconCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
      </div>
    </div>
  )

  if (inlineMode) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 font-sans animate-fade-in">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[44rem] bg-white shadow-2xl flex flex-col p-4">
        {content}
      </div>
    </div>
  )
}

export default WorkChapterEditor
