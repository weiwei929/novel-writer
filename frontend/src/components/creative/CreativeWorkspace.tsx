import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  scrapsApi,
  externalRefsApi,
  type Proposal,
  type Scrap,
  type FileReference,
} from '../../services/api'
import { createConceivingProposal, creativeStageLabel, getCreativeStage } from '../../services/creativeOrigin'
import { AI_FROZEN_LABEL } from '../../config/aiFreeze'
import { useNotifications } from '../../hooks/useNotifications'
import { IconCheckCircle, IconCreative } from '../ui/icons'

import CreateProposalModal from './CreateProposalModal'
import HandoffConfirmModal from '../ui/HandoffConfirmModal'

export default function CreativeWorkspace() {
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [refs, setRefs] = useState<FileReference[]>([])
  const [loading, setLoading] = useState(true)
  const [refCount, setRefCount] = useState(0)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [submittingProposal, setSubmittingProposal] = useState<Proposal | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([proposalsApi.getAll(), scrapsApi.getAll()])
      setProposals(p)
      setScraps(s)
    } catch { notifyError('加载失败') }
    try {
      const r = await externalRefsApi.getAll()
      setRefs(r.slice(0, 5))
      setRefCount(r.length)
    } catch { setRefs([]); setRefCount(0) }
    finally { setLoading(false) }
  }, [notifyError])

  useEffect(() => { void load() }, [load])

  const pending = useMemo(() => proposals.filter(p => p.status === 'draft'), [proposals])
  const formed = useMemo(
    () => proposals.filter(p => ['formed', 'submitted', 'evaluated', 'approved'].includes(p.status)),
    [proposals]
  )
  const formedReleased = useMemo(() => formed.filter(p => p.status !== 'formed'), [formed])

  const originList = useMemo(
    () => pending.filter(p => getCreativeStage(getProposalMetadata(p)) === 'origin'),
    [pending]
  )
  const conceivingList = useMemo(
    () => pending.filter(p => getCreativeStage(getProposalMetadata(p)) !== 'origin'),
    [pending]
  )

  const handleCreateSubmit = async (name: string) => {
    try {
      const created = await createConceivingProposal(name)
      await load()
      success('已创建作品构思')
      navigate(`/creative/proposals/${created.id}`)
    } catch {
      notifyError('创建失败')
    }
  }

  const handleConfirmSubmitToPlanning = async () => {
    if (!submittingProposal) return
    setActionLoading(true)
    try {
      await proposalsApi.updateStatus(submittingProposal.id, 'submitted')
      success('已成功提交至企划课')
      setSubmittingProposal(null)
      await load()
    } catch {
      notifyError('提交失败')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400">加载中…</div>
  }

  const scrapCount = scraps.length

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 animate-fade-in overflow-x-hidden">
      <div className="flex items-start gap-4 min-w-0">
        <div className="bg-amber-100 p-2 rounded-lg mt-1 shrink-0"><IconCreative size={22} className="text-amber-600" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">创意组</h1>
          <p className="text-sm text-gray-500 mt-1">从作品构思开始，沉淀标题、梗概和初步创意材料，形成创意作品。</p>
          <p className="text-xs text-gray-400 mt-1">{scrapCount + refCount} 条素材 · {pending.length} 部构思中 · {formed.length} 部已完成创意</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* 左列：创意来源 */}
        <section className="space-y-4 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">创意来源</h2>

          <Link
            to="/creative/scraps"
            className="block bg-white border rounded-xl p-4 hover:border-amber-200 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-amber-700">灵感碎片 {scrapCount} 条</span>
              <span className="text-xs text-amber-600 shrink-0">进入 →</span>
            </div>
            {scraps.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">暂无碎片</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {scraps.slice(0, 5).map(s => (
                  <li key={s.id} className="text-xs text-gray-600 truncate">{s.content?.slice(0, 60) || '未命名'}</li>
                ))}
                {scraps.length > 5 && <li className="text-xs text-gray-400">…还有 {scraps.length - 5} 条</li>}
              </ul>
            )}
          </Link>

          <Link
            to="/creative/external-refs"
            className="block bg-white border rounded-xl p-4 hover:border-amber-200 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-amber-700">外来参考 {refCount} 条</span>
              <span className="text-xs text-amber-600 shrink-0">进入 →</span>
            </div>
            {refs.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">暂无引用</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {refs.map(r => (
                  <li key={r.id} className="text-xs text-gray-600 truncate">{r.fileName}</li>
                ))}
                {refCount > 5 && <li className="text-xs text-gray-400">…还有 {refCount - 5} 条</li>}
              </ul>
            )}
          </Link>

          <div className="bg-white border rounded-xl p-4 opacity-60">
            <span className="text-sm font-semibold text-gray-400">AI 讨论</span>
            <p className="text-xs text-gray-400 mt-2">{AI_FROZEN_LABEL}</p>
          </div>
        </section>

        {/* 中列：作品构思中 */}
        <section className="space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">作品构思中 {pending.length} 部</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="text-xs px-2.5 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors shadow-xs"
            >
              + 新作品创意构思
            </button>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              暂无构思中作品。点击「新作品创意构思」开始。
            </p>
          ) : (
            <div className="space-y-4">
              {conceivingList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    构思深化中 ({conceivingList.length})
                  </h3>
                  {conceivingList.map(p => {
                    const meta = getProposalMetadata(p)
                    const stage = getCreativeStage(meta)
                    const stageLabel = creativeStageLabel(stage, p.status)
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/creative/proposals/${p.id}`)}
                        className="w-full text-left bg-white border border-amber-200/80 rounded-xl p-3.5 hover:border-amber-400 transition-all min-w-0 shadow-xs"
                      >
                        <h4 className="font-medium text-sm text-gray-900 truncate">{p.title}</h4>
                        <div className="text-xs text-amber-700 mt-1 flex items-center justify-between">
                          <span>{stageLabel}</span>
                          <span className="text-amber-600 font-normal">继续构思 →</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {originList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    灵感缘起初始 ({originList.length})
                  </h3>
                  {originList.map(p => {
                    const meta = getProposalMetadata(p)
                    const stage = getCreativeStage(meta)
                    const stageLabel = creativeStageLabel(stage, p.status)
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/creative/proposals/${p.id}`)}
                        className="w-full text-left bg-white border rounded-xl p-3.5 hover:border-gray-300 transition-all min-w-0"
                      >
                        <h4 className="font-medium text-sm text-gray-800 truncate">{p.title}</h4>
                        <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                          <span>{stageLabel}</span>
                          <span>完善缘起 →</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 右列：已完成创意作品 */}
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            已完成创意作品 {formed.length} 部
            {formedReleased.length > 0 && (
              <span className="text-xs font-normal text-gray-400 ml-1.5">· 已提交 {formedReleased.length} 部</span>
            )}
          </h2>
          {formed.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              暂无已完成创意作品。在构思页面点击「完成构思」后将显示在此。
            </p>
          ) : (
            <div className="space-y-3">
              {formed.map(p => {
                const isFormedOnly = p.status === 'formed'
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-4 min-w-0 transition-all ${
                      isFormedOnly
                        ? 'bg-white border border-amber-200 shadow-xs hover:border-amber-400'
                        : 'bg-gray-50/80 border border-gray-200 text-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm truncate flex-1 ${isFormedOnly ? 'font-semibold text-gray-900' : 'font-medium text-gray-400'}`}>
                        {p.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        isFormedOnly
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isFormedOnly ? '完工待提交' : '已提交企划课'}
                      </span>
                    </div>

                    <p className={`text-xs mt-2 line-clamp-2 ${isFormedOnly ? 'text-gray-500' : 'text-gray-400'}`}>
                      {p.synopsis || '暂无故事梗概'}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Link
                        to={`/creative/proposals/${p.id}`}
                        className={`text-xs hover:underline font-medium ${isFormedOnly ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        查看详情 →
                      </Link>

                      {isFormedOnly ? (
                        <button
                          type="button"
                          onClick={() => setSubmittingProposal(p)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <IconCheckCircle size={14} />
                          提交至企划课
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          已提交 · {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <CreateProposalModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <HandoffConfirmModal
        open={Boolean(submittingProposal)}
        targetDepartmentName="企划课"
        workTitle={submittingProposal?.title || ''}
        confirmText="确认提交"
        loading={actionLoading}
        onConfirm={() => void handleConfirmSubmitToPlanning()}
        onCancel={() => setSubmittingProposal(null)}
      />
    </div>
  )
}
