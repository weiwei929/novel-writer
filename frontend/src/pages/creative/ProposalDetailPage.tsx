import { IconArrowLeft, IconCheckCircle } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  type Proposal,
  type ProposalReference,
} from '../../services/api'
import {
  advanceConceivingToFormed,
  advanceOriginToConceiving,
  creativeStageHeading,
  creativeStageLabel,
  getCreativeStage,
} from '../../services/creativeOrigin'
import {
  getSettingSketch,
  normalizeWorkSetting,
  WORK_SETTING_BLOCKS,
  type WorkSetting,
} from '../../services/workSetting'
import { useNotifications } from '../../hooks/useNotifications'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'
import TypeLabel from '../../components/creative/TypeLabel'
import ReferencePicker from '../../components/creative/ReferencePicker'
import HandoffConfirmModal from '../../components/ui/HandoffConfirmModal'

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: notifyError } = useNotifications()

  const isPlanningRoute =
    location.pathname.startsWith('/planning') ||
    new URLSearchParams(location.search).get('from') === 'planning'

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showHandoffModal, setShowHandoffModal] = useState(false)

  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [evaluation, setEvaluation] = useState('')
  const [references, setReferences] = useState<ProposalReference[]>([])
  const [settingSketch, setSettingSketch] = useState<WorkSetting>(() => normalizeWorkSetting())

  const buildProposalPayload = useCallback(
    (source: Proposal) => {
      const meta = getProposalMetadata(source)
      return {
        title: title.trim() || '未命名提案',
        synopsis,
        references,
        metadata: {
          ...meta,
          _evaluation: evaluation,
          _settingSketch: normalizeWorkSetting(settingSketch),
        },
      }
    },
    [title, synopsis, evaluation, references, settingSketch]
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
      setEvaluation(meta._evaluation ?? '')
      setReferences((p.references as ProposalReference[]) || [])
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
        evaluation,
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

  const handleFinishConceiving = async () => {
    if (!id || !proposal) return
    const trimmedTitle = title.trim()
    const trimmedSynopsis = synopsis.trim()
    if (!trimmedTitle || !trimmedSynopsis) {
      notifyError('无法完成构思', '请填写标题和故事梗概')
      return
    }
    setSaving(true)
    try {
      const updated = await advanceConceivingToFormed(id, proposal, {
        title: trimmedTitle,
        synopsis: trimmedSynopsis,
        evaluation,
        references,
        settingSketch,
      })
      setProposal(updated)
      success('已完成构思', '作品已归入《已完成创意作品》')
    } catch {
      notifyError('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmSubmitPlanning = async () => {
    if (!id || !proposal) return
    setShowHandoffModal(false)
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
      navigate('/creative/workspace')
    } catch {
      notifyError('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAcceptIntoPlanning = async () => {
    if (!id || !proposal) return
    setSaving(true)
    try {
      const { projectId } = await proposalsApi.approve(id)
      success('已成功接收入企划课')
      navigate(`/work/${projectId}?from=planning`)
    } catch {
      notifyError('接收失败', '无法接收入企划课')
    } finally {
      setSaving(false)
    }
  }

  if (!proposal) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>未找到该创意作品</p>
        <Link
          to={isPlanningRoute ? '/planning/proposals' : '/creative/workspace'}
          className="text-blue-600 text-sm mt-2 inline-block"
        >
          {isPlanningRoute ? '返回企划课列表' : '返回创意组'}
        </Link>
      </div>
    )
  }

  const meta = getProposalMetadata(proposal)
  const stage = getCreativeStage(meta)
  const stageLabel = creativeStageLabel(stage, proposal.status)
  const headingPrefix = creativeStageHeading(stage, proposal.status)
  const canStartConceiving = proposal.status === 'draft' && stage === 'origin'
  const canFinishConceiving = proposal.status === 'draft' && (stage === 'conceiving' || !stage)
  const canSubmitPlanning =
    !isPlanningRoute &&
    (proposal.status === 'formed' || stage === 'formed')
  const canAcceptPlanning =
    isPlanningRoute &&
    (proposal.status === 'submitted' || proposal.status === 'evaluated') &&
    !proposal.projectId
  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={isPlanningRoute ? '/planning/proposals' : '/creative/workspace'}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <IconArrowLeft size={16} />
          {isPlanningRoute ? '返回企划课列表' : '返回创意组'}
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
      </section>

      <section className="bg-white border rounded-xl p-5 space-y-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">构思笔记</h2>
          <p className="text-xs text-gray-500 mt-1">
            为什么想写这个、主角大概是谁、参考了什么——写给自己看的幕后记录。
            立项后会随作品一起带进企划课。
          </p>
        </div>
        <textarea
          className={inputCls}
          rows={8}
          value={evaluation}
          onChange={e => setEvaluation(e.target.value)}
          placeholder="记录构思过程…（可留空）"
        />
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

      <section className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">引用素材</h2>
            <p className="text-xs text-gray-500 mt-1">
              关联灵感碎片或外来参考文件。立项后将作为只读附件跟随作品。
            </p>
          </div>
          {proposal.status === 'draft' && (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              + 引用素材
            </button>
          )}
        </div>
        {references.length === 0 ? (
          <p className="text-sm text-gray-400">暂无引用素材</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {references.map(r => (
              <li
                key={`${r.type}-${r.id}`}
                className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700 shrink-0">
                    {r.type === 'scrap' ? '灵感碎片' : '外来参考'}
                  </span>
                  <span className="font-medium text-gray-800 truncate">{r.title}</span>
                  {r.processingType && r.processingType !== 'none' && (
                    <TypeLabel type={r.processingType} compact />
                  )}
                </div>
                {proposal.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() =>
                      setReferences(references.filter(p => !(p.type === r.type && p.id === r.id)))
                    }
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    移除
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReferencePicker
        open={showPicker}
        selected={references}
        onConfirm={refs => {
          setReferences(refs)
          setShowPicker(false)
        }}
        onCancel={() => setShowPicker(false)}
      />

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
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 sm:ml-auto font-medium"
          >
            开始创意构思
          </button>
        )}
        {canFinishConceiving && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleFinishConceiving()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 sm:ml-auto font-medium shadow-xs"
          >
            完成构思
          </button>
        )}
        {canSubmitPlanning && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setShowHandoffModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm sm:ml-auto transition-colors"
          >
            <IconCheckCircle size={16} />
            提交至企划课
          </button>
        )}
        {canAcceptPlanning && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleAcceptIntoPlanning()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 sm:ml-auto flex items-center gap-1.5 shadow-sm font-medium"
          >
            <IconCheckCircle size={16} />
            接收入企划课
          </button>
        )}
        {!isPlanningRoute && (proposal.status === 'submitted' || proposal.status === 'evaluated') && !proposal.projectId && (
          <p className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-2.5 w-full">
            💡 提案已提交至企划课。审核与接收入企划课操作请在「企划课 - 待评估」列表中执行。
          </p>
        )}
        {proposal.projectId && (
          <button
            type="button"
            onClick={() => navigate(`/work/${proposal.projectId}?from=planning`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 sm:ml-auto flex items-center gap-1.5 shadow-sm font-medium"
          >
            前往作品详情 · 0~4 活体设定中枢 →
          </button>
        )}
        {canStartConceiving && (
          <p className="text-xs text-amber-700 w-full sm:w-auto">
            确认缘起内容后，点击「开始创意构思」进入下一阶段。
          </p>
        )}
      </div>

      <HandoffConfirmModal
        open={showHandoffModal}
        targetDepartmentName="企划课"
        workTitle={proposal.title}
        confirmText="确认提交"
        loading={saving}
        onConfirm={() => void handleConfirmSubmitPlanning()}
        onCancel={() => setShowHandoffModal(false)}
      />
    </div>
  )
}
