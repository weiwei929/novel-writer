import { IconArrowLeft } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  type Proposal,
  type ProposalReference,
} from '../../services/api'
import { advanceOriginToConceiving, creativeStageHeading, creativeStageLabel, getCreativeStage } from '../../services/creativeOrigin'
import {
  getSettingSketch,
  normalizeWorkSetting,
  WORK_SETTING_BLOCKS,
  type WorkSetting,
} from '../../services/workSetting'
import { useNotifications } from '../../hooks/useNotifications'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'
import TagInput from '../../components/creative/TagInput'
import TypeLabel from '../../components/creative/TypeLabel'

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [innovation, setInnovation] = useState('')
  const [coreSetting, setCoreSetting] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [settingSketch, setSettingSketch] = useState<WorkSetting>(() => normalizeWorkSetting())

  const buildProposalPayload = useCallback(
    (source: Proposal) => {
      const meta = getProposalMetadata(source)
      return {
        title: title.trim() || '未命名提案',
        synopsis,
        innovation,
        coreSetting,
        metadata: {
          ...meta,
          _tags: tags,
          _settingSketch: normalizeWorkSetting(settingSketch),
        },
      }
    },
    [title, synopsis, innovation, coreSetting, tags, settingSketch]
  )

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
      setSettingSketch(getSettingSketch(meta as Record<string, unknown>))
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
      const updated = await proposalsApi.update(id, buildProposalPayload(proposal))
      setProposal(updated)
      success('已保存')
    } catch {
      notifyError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleStartConceiving = async () => {
    if (!id || !proposal) return
    setSaving(true)
    try {
      const updated = await advanceOriginToConceiving(id, proposal, {
        title,
        synopsis,
        innovation,
        coreSetting,
        tags,
        settingSketch,
      })
      setProposal(updated)
      success('已进入作品创意构思')
    } catch {
      notifyError('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleEnterPlanning = async () => {
    if (!id || !proposal) return
    const meta = getProposalMetadata(proposal)
    const currentStage = getCreativeStage(meta)
    if (currentStage === 'origin') {
      notifyError('提交失败', '请先点击「开始创意构思」，再提交企划课')
      return
    }
    const trimmedTitle = title.trim()
    const trimmedSynopsis = synopsis.trim()
    if (!trimmedTitle || !trimmedSynopsis) {
      notifyError('提交失败', '请填写标题和故事梗概后再提交企划课')
      return
    }
    setSaving(true)
    try {
      await proposalsApi.update(id, {
        ...buildProposalPayload(proposal),
        title: trimmedTitle,
        synopsis: trimmedSynopsis,
      })
      await proposalsApi.updateStatus(id, 'submitted')
      success('已提交至企划课')
      navigate('/creative/chat')
    } catch {
      notifyError('操作失败')
    } finally {
      setSaving(false)
    }
  }

  if (!proposal) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>未找到该创意作品</p>
        <Link to="/creative/chat" className="text-blue-600 text-sm mt-2 inline-block">
          返回创意组
        </Link>
      </div>
    )
  }

  const meta = getProposalMetadata(proposal)
  const stage = getCreativeStage(meta)
  const stageLabel = creativeStageLabel(stage, proposal.status)
  const headingPrefix = creativeStageHeading(stage, proposal.status)
  const canStartConceiving = proposal.status === 'draft' && stage === 'origin'
  const canSubmitPlanning =
    proposal.status === 'draft' && stage !== 'origin'
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
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
            {stageLabel}
          </span>
          <ProposalStatusBadge status={proposal.status} />
          {proposal.projectId && (
            <Link
              to="/planning/in-progress"
              className="text-sm text-blue-600 hover:underline"
            >
              查看企划承接
            </Link>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {headingPrefix}：《{proposal.title}》
      </h1>

      {(meta._sourceNote || meta._sourceRef) && (
        <section className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 text-sm text-gray-700">
          <h2 className="text-xs font-semibold text-amber-900 mb-1">来源说明</h2>
          {meta._sourceNote && <p>{meta._sourceNote}</p>}
          {meta._sourceRef?.title && !meta._sourceNote && (
            <p>启发来源：{meta._sourceRef.title}</p>
          )}
        </section>
      )}

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
          <p className="text-xs text-gray-400 mt-1">
            旧字段，逐步淡出。立项后企划课优先继承下方「设定雏形」四块，不会自动同步此处内容。
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500">标签</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">设定雏形（可选）</h2>
          <p className="text-xs text-gray-500 mt-1">
            四块均可选填，填几块算几块；提交企划课时不做硬性要求。立项后非空块会带入企划课作品设定。
          </p>
        </div>
        {WORK_SETTING_BLOCKS.map(block => (
          <div key={block.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {block.label}
              {block.required ? (
                <span className="text-gray-400 font-normal ml-1">（企划课完善时建议填写）</span>
              ) : (
                <span className="text-gray-400 font-normal ml-1">（可选）</span>
              )}
            </label>
            <textarea
              className={inputCls}
              rows={4}
              value={settingSketch[block.key]}
              onChange={e =>
                setSettingSketch(prev => ({ ...prev, [block.key]: e.target.value }))
              }
              placeholder={`记录${block.label}…`}
            />
          </div>
        ))}
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">历史引用材料（只读）</h2>
        {references.length === 0 ? (
          <p className="text-sm text-gray-400">无引用材料</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {references.map(r => (
              <li key={`${r.type}-${r.id}`} className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0">
                  [{r.type === 'scrap' ? '灵感碎片' : '外来参考'}]
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
        <h2 className="text-sm font-semibold text-gray-800 mb-2">构思评估记录</h2>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 min-h-[120px]">
          {meta._evaluation || '（无评估记录）'}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          保存
        </button>
        <p className="text-xs text-gray-400 sm:ml-1">仅保存当前内容，不改变作品流程状态。</p>
        {canStartConceiving && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleStartConceiving()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 sm:ml-auto"
          >
            开始创意构思
          </button>
        )}
        {canSubmitPlanning && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleEnterPlanning()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 sm:ml-auto"
          >
            提交企划课
          </button>
        )}
        {canStartConceiving && (
          <p className="text-xs text-amber-700 w-full sm:w-auto">
            确认缘起内容后，点击「开始创意构思」进入下一阶段。
          </p>
        )}
        {/* 0608 P2-2b: shelve 用户路径已屏蔽 */}
      </div>
    </div>
  )
}
