import { IconArrowLeft, IconCheckCircle } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { proposalsApi, type Proposal } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import WorldBuildingPage from '../creative/WorldBuildingPage'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'
import { AI_UI_FROZEN } from '../../config/aiFreeze'
import { useSettingsStore } from '../../stores/settingsStore'

export default function ProposalEvalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const aiReviewer = useSettingsStore(s => s.ai.reviewer)
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setProposal(await proposalsApi.getById(id))
    } catch {
      addNotification({ type: 'error', title: '加载失败', message: '无法加载该待企划作品' })
    } finally {
      setLoading(false)
    }
  }, [id, addNotification])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (id && proposal && proposal.status !== 'approved' && !proposal.projectId) {
      setCurrentScope({ type: 'proposal', id })
    }
    return () => setCurrentScope(null)
  }, [id, proposal, setCurrentScope])

  const handleAccept = async () => {
    if (!id) return
    setActing(true)
    try {
      const { projectId } = await proposalsApi.approve(id)
      addNotification({
        type: 'success',
        title: '已接收入企划课',
        message: '作品设定已迁入企划进行中，可继续编辑设定与章节架构',
      })
      navigate(`/work/${projectId}?from=planning`)
    } catch {
      addNotification({ type: 'error', title: '接收失败', message: '无法接收入企划课' })
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">未找到该待企划作品。</p>
        <button onClick={() => navigate('/planning/proposals')} className="mt-3 text-blue-600 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  const roCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed'

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/planning/proposals')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <IconArrowLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          <ProposalStatusBadge status={proposal.status} />
          {proposal.status !== 'approved' && (
            <button
              onClick={() => void handleAccept()}
              disabled={acting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <IconCheckCircle size={15} />
              接收入企划课
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input className={roCls} value={proposal.title} disabled readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故事梗概</label>
          <textarea className={roCls} rows={3} value={proposal.synopsis ?? ''} disabled readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">创新点</label>
          <textarea className={roCls} rows={2} value={proposal.innovation ?? ''} disabled readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">核心设定</label>
          <textarea className={roCls} rows={3} value={proposal.coreSetting ?? ''} disabled readOnly />
        </div>
      </div>

      {aiReviewer && !AI_UI_FROZEN && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-violet-900 mb-2">AI 评估</h2>
          <p className="text-sm text-violet-800/80">
            AI 审校官将在此对待企划作品给出结构化评估意见。该功能正在开发中，当前仅显示入口占位。
          </p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">遗留资料（只读）</h2>
        {proposal.status === 'approved' && proposal.projectId ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            该提案已接收入企划课。作品设定请前往
            <button
              type="button"
              onClick={() => navigate(`/work/${proposal.projectId}?from=planning`)}
              className="mx-1 text-blue-600 hover:underline"
            >
              作品详情 · 作品设定
            </button>
            查看。
          </div>
        ) : (
          <WorldBuildingPage readOnly />
        )}
      </div>
    </div>
  )
}
