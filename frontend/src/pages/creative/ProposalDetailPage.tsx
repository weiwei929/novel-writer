import { IconArrowLeft } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  type Proposal,
  type ProposalReference,
} from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'
import TagInput from '../../components/creative/TagInput'
import TypeLabel from '../../components/creative/TypeLabel'

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [innovation, setInnovation] = useState('')
  const [coreSetting, setCoreSetting] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const p = await proposalsApi.getById(id)
      setProposal(p)
      const meta = getProposalMetadata(p)
      setTitle(p.title ?? '')
      setSynopsis(p.synopsis ?? '')
      setInnovation(p.innovation ?? '')
      setCoreSetting(p.coreSetting ?? '')
      setTags(meta._tags || [])
    } catch {
      notifyError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [id, notifyError])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    if (!id || !proposal) return
    setSaving(true)
    try {
      const meta = getProposalMetadata(proposal)
      const updated = await proposalsApi.update(id, {
        title: title.trim() || '未命名提案',
        synopsis,
        innovation,
        coreSetting,
        metadata: { ...meta, _tags: tags },
      })
      setProposal(updated)
      success('已保存')
    } catch {
      notifyError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleEnterPlanning = async () => {
    if (!id || !proposal) return
    setSaving(true)
    try {
      const meta = getProposalMetadata(proposal)
      await proposalsApi.update(id, {
        title: title.trim() || '未命名提案',
        synopsis,
        innovation,
        coreSetting,
        metadata: { ...meta, _tags: tags },
      })
      await proposalsApi.updateStatus(id, 'submitted')
      success('已进入企划建议书')
      navigate('/creative/proposals')
    } catch {
      notifyError('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleShelve = async () => {
    if (!id) return
    try {
      await proposalsApi.evaluate(id, 'shelve')
      success('已移入作品暂存')
      await load()
    } catch {
      notifyError('暂存失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-400 text-sm">加载中…</div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>未找到该创意提案</p>
        <Link to="/creative/chat" className="text-blue-600 text-sm mt-2 inline-block">
          返回创意讨论
        </Link>
      </div>
    )
  }

  const meta = getProposalMetadata(proposal)
  const references = (proposal.references as ProposalReference[]) || []
  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/creative/chat"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <IconArrowLeft size={16} />
          返回创意组
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <ProposalStatusBadge status={proposal.status} />
          {proposal.projectId && (
            <Link
              to={`/work/${proposal.projectId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              查看作品
            </Link>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        创意提案：《{proposal.title}》
      </h1>

      <section className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">基础信息</h2>
        <div>
          <label className="text-xs text-gray-500">标题</label>
          <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500">故事梗概</label>
          <textarea
            className={inputCls}
            rows={3}
            value={synopsis}
            onChange={e => setSynopsis(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">创新点</label>
          <textarea
            className={inputCls}
            rows={2}
            value={innovation}
            onChange={e => setInnovation(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">核心设定</label>
          <textarea
            className={inputCls}
            rows={3}
            value={coreSetting}
            onChange={e => setCoreSetting(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">标签</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">引用材料</h2>
        {references.length === 0 ? (
          <p className="text-sm text-gray-400">无引用材料</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {references.map(r => (
              <li key={`${r.type}-${r.id}`} className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0">
                  [{r.type === 'scrap' ? '灵感手记' : '外来参考'}]
                </span>
                <span className="font-medium">{r.title}</span>
                {r.processingType && r.processingType !== 'none' && (
                  <TypeLabel type={r.processingType} compact />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">创意讨论记录</h2>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 min-h-[120px]">
          {meta._evaluation || '（无评估记录）'}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          保存
        </button>
        {proposal.status === 'draft' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleEnterPlanning()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
          >
            进入企划建议书 →
          </button>
        )}
        {proposal.status !== 'shelved' && proposal.status !== 'approved' && (
          <button
            type="button"
            onClick={() => void handleShelve()}
            className="px-4 py-2 text-sm text-gray-500 hover:text-amber-700"
          >
            暂存
          </button>
        )}
      </div>
    </div>
  )
}
