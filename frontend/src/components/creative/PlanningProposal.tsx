import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  type Proposal,
} from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import ProposalStatusBadge from '../proposals/ProposalStatusBadge'
import { IconClose } from '../ui/icons'

export default function PlanningProposal() {
  const { success, error: notifyError } = useNotifications()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState<Proposal | null>(null)
  const [acting, setActing] = useState(false)

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

  const pending = useMemo(
    () =>
      proposals.filter(
        p =>
          p.status === 'submitted' ||
          (p.status === 'draft' && getProposalMetadata(p)._discussionSubmitted)
      ),
    [proposals]
  )

  const evaluated = useMemo(
    () => proposals.filter(p => ['approved', 'rejected', 'shelved', 'evaluated'].includes(p.status)),
    [proposals]
  )

  const handleEvaluate = async (action: 'approve' | 'reject' | 'shelve') => {
    if (!evaluating) return
    setActing(true)
    try {
      const result = await proposalsApi.evaluate(evaluating.id, action)
      if (action === 'approve' && result.projectId) {
        success('已同意立项', `作品已创建，可前往 /work/${result.projectId}`)
      } else if (action === 'reject') {
        success('已退回创意讨论')
      } else {
        success('已移入作品暂存')
      }
      setEvaluating(null)
      await load()
    } catch {
      notifyError('评估失败')
    } finally {
      setActing(false)
    }
  }

  const submitToReview = async (p: Proposal) => {
    try {
      await proposalsApi.updateStatus(p.id, 'submitted')
      success('已进入企划建议书待评估')
      await load()
    } catch {
      notifyError('操作失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400 text-sm">加载中…</div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">待评估</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 border border-dashed rounded-xl p-8 text-center">
            暂无待评估提案。在创意提案详情页点击「进入企划建议书」后会出现于此。
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 p-4 bg-white border rounded-xl"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{p.title}</span>
                    <ProposalStatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    提交于 {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {p.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => void submitToReview(p)}
                      className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                    >
                      送审
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEvaluating(p)}
                    className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg"
                  >
                    评估
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">已评估</h2>
        {evaluated.length === 0 ? (
          <p className="text-sm text-gray-400">暂无记录</p>
        ) : (
          <ul className="space-y-2">
            {evaluated.map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{p.title}</span>
                  <ProposalStatusBadge status={p.status} />
                </div>
                {p.projectId ? (
                  <Link to={`/work/${p.projectId}`} className="text-xs text-blue-600 shrink-0">
                    查看作品
                  </Link>
                ) : (
                  <Link
                    to={`/creative/proposals/${p.id}`}
                    className="text-xs text-gray-500 shrink-0"
                  >
                    查看提案
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {evaluating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-semibold">评估：{evaluating.title}</h3>
              <button type="button" onClick={() => setEvaluating(null)}>
                <IconClose size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p>
                  <span className="text-gray-500">梗概：</span>
                  {evaluating.synopsis || '—'}
                </p>
                <p>
                  <span className="text-gray-500">创新点：</span>
                  {evaluating.innovation || '—'}
                </p>
                <p>
                  <span className="text-gray-500">引用：</span>
                  {(evaluating.references || []).length} 项材料
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleEvaluate('approve')}
                  className="w-full text-left p-3 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <span className="font-medium text-blue-800">✓ 同意 → 进入企划课</span>
                  <p className="text-xs text-gray-500 mt-1">
                    创建作品（draft），Type 1 全文自动拆分为章节
                  </p>
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleEvaluate('reject')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">↩ 退回 → 创意讨论</span>
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleEvaluate('shelve')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">📦 暂存 → 作品暂存</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
