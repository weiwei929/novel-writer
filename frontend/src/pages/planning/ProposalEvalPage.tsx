import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Undo2, CheckCircle2, Archive } from 'lucide-react'
import { proposalsApi, type Proposal } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import WorldBuildingPage from '../creative/WorldBuildingPage'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'

export default function ProposalEvalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
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
      addNotification({ type: 'error', title: '加载失败', message: '无法加载该企划建议书' })
    } finally {
      setLoading(false)
    }
  }, [id, addNotification])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (id) setCurrentScope({ type: 'proposal', id })
    return () => setCurrentScope(null)
  }, [id, setCurrentScope])

  const handleReturn = async () => {
    if (!id) return
    setActing(true)
    try {
      await proposalsApi.updateStatus(id, 'draft')
      addNotification({ type: 'success', title: '已退回', message: '已退回创意组继续编辑' })
      navigate('/planning/proposals')
    } catch {
      addNotification({ type: 'error', title: '操作失败', message: '无法退回提案' })
    } finally {
      setActing(false)
    }
  }

  const notImplemented = (name: string) =>
    addNotification({ type: 'info', title: '开发中', message: `「${name}」将在立项流程卡中实现` })

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
        <p className="text-sm">未找到该企划建议书。</p>
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
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/planning/proposals')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          <ProposalStatusBadge status={proposal.status} />
          <button
            onClick={handleReturn}
            disabled={acting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Undo2 size={15} />
            退回创意组
          </button>
          <button
            onClick={() => notImplemented('通过立项')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
          >
            <CheckCircle2 size={15} />
            通过立项
          </button>
          <button
            onClick={() => notImplemented('暂存审查池')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Archive size={15} />
            暂存审查池
          </button>
        </div>
      </div>

      {/* 提案文本（只读） */}
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

      {/* 作品设定（只读） */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">作品设定（只读）</h2>
        <WorldBuildingPage readOnly />
      </div>
    </div>
  )
}
