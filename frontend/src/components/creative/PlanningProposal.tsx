import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { proposalsApi, type Proposal } from '../../services/api'
import { isProposalApproved, isProposalPendingReview } from '../../services/filters'
import { useNotifications } from '../../hooks/useNotifications'
import ProposalStatusBadge from '../proposals/ProposalStatusBadge'

export default function PlanningProposal() {
  const { error: notifyError } = useNotifications()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

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
    () => proposals.filter(isProposalPendingReview),
    [proposals]
  )

  const evaluated = useMemo(
    () => proposals.filter(isProposalApproved),
    [proposals]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400 text-sm">加载中…</div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">已提交 / 待企划接收</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 border border-dashed rounded-xl p-8 text-center">
            暂无已提交提案。在创意讨论或提案详情页提交后将出现在此。
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
                <Link
                  to={`/creative/proposals/${p.id}`}
                  className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 shrink-0"
                >
                  查看详情
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">已接收入企划课</h2>
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
                  <Link
                    to={`/work/${p.projectId}?from=planning`}
                    className="text-xs text-blue-600 shrink-0"
                  >
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
    </div>
  )
}
