import React, { useEffect, useState } from 'react'
import { X, Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import { projectsApi, chaptersApi, Chapter } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

type PlanStatus = 'planned' | 'started' | 'completed'

export interface ChapterPlanItem {
  id: string
  order: number
  title: string
  plannedLength: number
  synopsisText?: string
  keyPlotPoints?: string[]
  status: PlanStatus
}

interface ChapterPlanningEditorProps {
  projectId: string
  initialPlans?: ChapterPlanItem[]
  onClose: () => void
  onSaved?: (plans: ChapterPlanItem[]) => void
}

const emptyPlan = (nextOrder: number): ChapterPlanItem => ({
  id: Math.random().toString(36).slice(2),
  order: nextOrder,
  title: `第${nextOrder}章（待定）`,
  plannedLength: 2000,
  synopsisText: '',
  status: 'planned',
})

const ChapterPlanningEditor: React.FC<ChapterPlanningEditorProps> = ({
  projectId,
  initialPlans = [],
  onClose,
  onSaved,
}) => {
  const { success, error: notifyError, warning } = useNotifications()
  const [plans, setPlans] = useState<ChapterPlanItem[]>(() => {
    const sorted = [...initialPlans].sort((a, b) => a.order - b.order)
    return sorted.map((p, idx) => ({ ...p, order: idx + 1 }))
  })
  const [saving, setSaving] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])

  // 预留：如需基于 nextOrder 显示建议标题等，可启用
  // const nextOrder = useMemo(() => plans.length + 1, [plans.length])

  const updatePlan = (index: number, patch: Partial<ChapterPlanItem>) => {
    setPlans(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const addPlan = () => {
    setPlans(prev => [...prev, emptyPlan(prev.length + 1)])
  }

  const duplicatePlan = (index: number) => {
    const src = plans[index]
    const dup: ChapterPlanItem = {
      ...src,
      id: Math.random().toString(36).slice(2),
      title: src.title + '（副本）',
    }
    const next = [...plans]
    next.splice(index + 1, 0, dup)
    setPlans(reorder(next))
  }

  const deletePlan = (index: number) => {
    const next = plans.filter((_, i) => i !== index)
    setPlans(reorder(next))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...plans]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setPlans(reorder(next))
  }

  const moveDown = (index: number) => {
    if (index === plans.length - 1) return
    const next = [...plans]
    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
    setPlans(reorder(next))
  }

  const reorder = (arr: ChapterPlanItem[]) => arr.map((p, i) => ({ ...p, order: i + 1 }))

  // 载入现有章节，作为顶部参考列表；若无初始规划，按章节生成规划草稿
  useEffect(() => {
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
          setPlans(drafts)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [projectId, initialPlans.length])

  const save = async () => {
    try {
      setSaving(true)
      // 简单校验：标题不可空
      const invalid = plans.find(p => !p.title || !p.title.trim())
      if (invalid) {
        warning('校验失败', '存在标题为空的规划项，请补全后再保存')
        return
      }
      const payload = reorder(plans)
      const saved = await projectsApi.updateChapterPlanning(projectId, payload)
      // 同步：根据规划创建缺失章节，并更新已存在章节的标题/状态/梗概
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
                status: (mappedStatus as any) || created.status,
                summary: p.synopsisText || created.summary,
              })
            }
          } else {
            const patch: Partial<Chapter> = {}
            if (p.title && p.title !== at.title) patch.title = p.title
            if ((p.synopsisText || '') !== (at.summary || '')) patch.summary = p.synopsisText
            if (mappedStatus && mappedStatus !== at.status) patch.status = mappedStatus as any
            if (Object.keys(patch).length > 0) {
              await chaptersApi.update(at.id, patch)
            }
          }
        }
      } catch (syncErr) {
        console.warn('章节同步未完成（不影响规划保存）：', syncErr)
      }
      success('章节规划已保存')
      onSaved?.(saved as ChapterPlanItem[])
      onClose()
    } catch (e: any) {
      console.error(e)
      notifyError('保存章节规划失败', e?.message || '请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[44rem] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">章节规划</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              结构化编辑（顺序、标题、预计字数、梗概、状态）
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addPlan}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> 新增
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded" title="关闭">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          {/* 现有章节参考列表 */}
          {chapters.length > 0 && (
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
              暂无规划项，点击“新增”开始
            </div>
          )}
          {plans.map((p, idx) => (
            <div key={p.id} className="bg-white rounded border shadow-sm p-3">
              <div className="flex items-start gap-3">
                {/* 排序与操作 */}
                <div className="flex flex-col items-center gap-1 mt-1">
                  <button
                    onClick={() => moveUp(idx)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="上移"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="text-xs text-gray-500 w-8 text-center">{p.order}</div>
                  <button
                    onClick={() => moveDown(idx)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="下移"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* 表单区 */}
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-7">
                    <label className="block text-xs text-gray-600 mb-1">标题</label>
                    <input
                      value={p.title}
                      onChange={e => updatePlan(idx, { title: e.target.value })}
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
                        updatePlan(idx, { plannedLength: Number(e.target.value || 0) })
                      }
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">状态</label>
                    <select
                      value={p.status}
                      onChange={e => updatePlan(idx, { status: e.target.value as PlanStatus })}
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
                      onChange={e => updatePlan(idx, { synopsisText: e.target.value })}
                      placeholder="简述本章的核心推进与要点"
                      className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                </div>

                {/* 右侧操作 */}
                <div className="flex flex-col items-center gap-1 mt-1">
                  <button
                    onClick={() => duplicatePlan(idx)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="复制"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePlan(idx)}
                    className="p-1 hover:bg-red-50 rounded text-red-600"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChapterPlanningEditor
