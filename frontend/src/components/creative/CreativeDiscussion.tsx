import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  type Proposal,
  type ProposalReference,
} from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import ThreeColumnLayout from './ThreeColumnLayout'
import TagInput, { TagFilterBar } from './TagInput'
import ReferencePicker from './ReferencePicker'
import { isProposalPendingReview, isProposalSubmittable } from '../../services/filters'

function isPendingDiscussion(p: Proposal): boolean {
  if (!isProposalSubmittable(p)) return false
  const meta = getProposalMetadata(p)
  return meta._discussionSubmitted !== true
}

function isFormedProposal(p: Proposal): boolean {
  const meta = getProposalMetadata(p)
  return meta._discussionSubmitted === true || isProposalPendingReview(p)
}

export default function CreativeDiscussion() {
  const { success, error: notifyError } = useNotifications()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [evaluation, setEvaluation] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [references, setReferences] = useState<ProposalReference[]>([])
  const [submitMode, setSubmitMode] = useState<'continue' | 'submit'>('continue')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProposals(await proposalsApi.getAll())
    } catch {
      notifyError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    void load()
  }, [load])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of proposals) {
      for (const t of getProposalMetadata(p)._tags || []) set.add(t)
    }
    return [...set].sort()
  }, [proposals])

  const pending = useMemo(() => {
    return proposals.filter(p => {
      if (!isPendingDiscussion(p)) return false
      if (!activeTag) return true
      return (getProposalMetadata(p)._tags || []).includes(activeTag)
    })
  }, [proposals, activeTag])

  const formed = useMemo(
    () => proposals.filter(isFormedProposal),
    [proposals]
  )

  const selectProposal = (p: Proposal | null) => {
    if (!p) {
      setSelectedId(null)
      setTitle('')
      setEvaluation('')
      setTags([])
      setReferences([])
      return
    }
    const meta = getProposalMetadata(p)
    setSelectedId(p.id)
    setTitle(p.title)
    setEvaluation(meta._evaluation || p.synopsis || '')
    setTags(meta._tags || [])
    setReferences((p.references as ProposalReference[]) || [])
  }

  const handleNewDiscussion = async () => {
    const name = window.prompt('讨论标题', '新创意讨论')
    if (!name?.trim()) return
    try {
      const created = await proposalsApi.create({
        title: name.trim(),
        metadata: { _evaluation: '', _tags: [], _discussionSubmitted: false },
      })
      await load()
      selectProposal(created)
      success('已创建讨论')
    } catch {
      notifyError('创建失败')
    }
  }

  const persistDraft = async () => {
    if (!selectedId) return false
    setSaving(true)
    try {
      await proposalsApi.update(selectedId, {
        title: title.trim() || '未命名讨论',
        synopsis: evaluation.slice(0, 500) || undefined,
        references,
        metadata: {
          _evaluation: evaluation,
          _tags: tags,
          _discussionSubmitted: submitMode === 'submit',
        },
      })
      await load()
      return true
    } catch {
      notifyError('保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedId) return
    const ok = await persistDraft()
    if (ok) success('草稿已保存')
  }

  const handleSubmitProposal = async () => {
    if (!selectedId || !evaluation.trim()) {
      notifyError('请填写评估意见')
      return
    }
    setSubmitMode('submit')
    setSaving(true)
    try {
      const type1Ref = references.find(
        r => r.type === 'file_ref' && r.processingType === 'complete'
      )
      await proposalsApi.update(selectedId, {
        title: title.trim() || '未命名提案',
        synopsis: evaluation.slice(0, 500),
        references,
        metadata: {
          _evaluation: evaluation,
          _tags: tags,
          _discussionSubmitted: true,
          ...(type1Ref ? { _sourceRef: { type: 'file_ref', id: type1Ref.id, title: type1Ref.title } } : {}),
        },
        status: 'submitted',
      })
      success('创意提案已提交')
      await load()
    } catch {
      notifyError('提交失败')
    } finally {
      setSaving(false)
      setSubmitMode('continue')
    }
  }

  const leftPanel = (
    <>
      <div className="px-3 py-2 border-b bg-gray-50 flex justify-between items-center">
        <span className="text-sm font-medium">待讨论</span>
        <button
          type="button"
          onClick={() => void handleNewDiscussion()}
          className="text-xs px-2 py-1 bg-amber-600 text-white rounded"
        >
          + 新建
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-xs text-gray-400 p-2">加载中…</p>
        ) : pending.length === 0 ? (
          <p className="text-xs text-gray-400 p-2">暂无讨论，点击新建</p>
        ) : (
          pending.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectProposal(p)}
              className={`w-full text-left px-2 py-2 rounded-lg text-sm ${
                selectedId === p.id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium truncate">{p.title}</div>
              <div className="text-xs text-gray-400">
                引用 ×{(p.references as ProposalReference[])?.length || 0}
              </div>
            </button>
          ))
        )}
      </div>
    </>
  )

  const middlePanel = (
    <>
      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">讨论评估区</div>
      {!selectedId ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8">
          选择或新建讨论
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
            placeholder="讨论标题"
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">引用材料</span>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="text-xs text-amber-700 hover:underline"
              >
                + 引用更多素材
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {references.length === 0 ? (
                <li className="text-gray-400 text-xs">尚未引用素材</li>
              ) : (
                references.map(r => (
                  <li key={`${r.type}-${r.id}`} className="flex gap-2 text-gray-700">
                    <span className="text-gray-400 shrink-0">
                      [{r.type === 'scrap' ? '灵感' : '外来'}]
                    </span>
                    <span className="truncate">{r.title}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <label className="text-xs text-gray-500">评估意见（自由文本）</label>
            <textarea
              value={evaluation}
              onChange={e => setEvaluation(e.target.value)}
              rows={12}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-y min-h-[200px]"
              placeholder="人物关系、场景线索、世界观补充…"
            />
          </div>

          <TagInput tags={tags} onChange={setTags} suggestions={allTags} />

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={submitMode === 'submit'}
                onChange={() => setSubmitMode('submit')}
              />
              提交创意提案
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={submitMode === 'continue'}
                onChange={() => setSubmitMode('continue')}
              />
              继续讨论
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveDraft()}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              保存草稿
            </button>
            <button
              type="button"
              disabled={saving || submitMode !== 'submit'}
              onClick={() => void handleSubmitProposal()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              确认提交
            </button>
          </div>
        </div>
      )}
    </>
  )

  const rightPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">成型提案</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {formed.length === 0 ? (
          <p className="text-xs text-gray-400">提交后将显示在此</p>
        ) : (
          formed.map(p => (
            <div key={p.id} className="p-2 border rounded-lg bg-green-50/50 border-green-100">
              <div className="font-medium text-sm">{p.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {p.status === 'submitted' ? '已进入企划建议书' : '待进入企划建议书'}
              </div>
              <Link
                to={`/creative/proposals/${p.id}`}
                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
              >
                查看提案 →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <>
      <ThreeColumnLayout
        header={<TagFilterBar allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />}
        left={leftPanel}
        middle={middlePanel}
        right={rightPanel}
      />
      <ReferencePicker
        open={pickerOpen}
        selected={references}
        onConfirm={refs => {
          setReferences(refs)
          setPickerOpen(false)
        }}
        onCancel={() => setPickerOpen(false)}
      />
    </>
  )
}
