import { IconArrowLeft, IconSave, IconSend } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { proposalsApi, type Proposal } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import WorldBuildingPage from './WorldBuildingPage'
import ProposalStatusBadge from '../../components/proposals/ProposalStatusBadge'

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [innovation, setInnovation] = useState('')
  const [coreSetting, setCoreSetting] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const p = await proposalsApi.getById(id)
      setProposal(p)
      setTitle(p.title ?? '')
      setSynopsis(p.synopsis ?? '')
      setInnovation(p.innovation ?? '')
      setCoreSetting(p.coreSetting ?? '')
    } catch {
      addNotification({ type: 'error', title: '加载失败', message: '无法加载该企划建议书' })
    } finally {
      setLoading(false)
    }
  }, [id, addNotification])

  useEffect(() => {
    void load()
  }, [load])

  // 设置作品设定数据归属为当前提案
  useEffect(() => {
    if (id) setCurrentScope({ type: 'proposal', id })
    return () => setCurrentScope(null)
  }, [id, setCurrentScope])

  const handleSaveDraft = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await proposalsApi.update(id, {
        title: title.trim() || '未命名企划建议书',
        synopsis,
        innovation,
        coreSetting,
      })
      setProposal(updated)
      addNotification({ type: 'success', title: '已保存', message: '草稿已保存' })
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '无法保存草稿' })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    setSaving(true)
    try {
      // 先保存内容再提交，避免未保存的编辑丢失
      await proposalsApi.update(id, {
        title: title.trim() || '未命名企划建议书',
        synopsis,
        innovation,
        coreSetting,
      })
      await proposalsApi.updateStatus(id, 'submitted')
      addNotification({ type: 'success', title: '已提交评估', message: '已提交至企划课评估' })
      navigate('/planning/proposals')
    } catch {
      addNotification({ type: 'error', title: '提交失败', message: '无法提交评估' })
    } finally {
      setSaving(false)
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
        <p className="text-sm">未找到该企划建议书。</p>
        <button onClick={() => navigate('/creative/proposals')} className="mt-3 text-blue-600 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  const isDraft = proposal.status === 'draft'
  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/creative/proposals')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <IconArrowLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          <ProposalStatusBadge status={proposal.status} />
          {proposal.projectId && (
            <button
              onClick={() => navigate(`/work/${proposal.projectId}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              查看项目
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconSave size={15} />
            保存草稿
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isDraft}
            title={isDraft ? '提交至企划课评估' : '该提案已提交，无法重复提交'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconSend size={15} />
            提交评估
          </button>
        </div>
      </div>

      {/* 提案字段编辑器 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题 <span className="text-red-500">*</span>
          </label>
          <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="企划建议书标题" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故事梗概</label>
          <textarea className={inputCls} rows={3} value={synopsis} onChange={e => setSynopsis(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">创新点</label>
          <textarea className={inputCls} rows={2} value={innovation} onChange={e => setInnovation(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">核心设定（高层自由描述）</label>
          <textarea className={inputCls} rows={3} value={coreSetting} onChange={e => setCoreSetting(e.target.value)} />
        </div>
      </div>

      {/* 作品设定（人物设定 / 故事线 / 创作心流） */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">作品设定</h2>
        <WorldBuildingPage readOnly={false} />
      </div>
    </div>
  )
}
