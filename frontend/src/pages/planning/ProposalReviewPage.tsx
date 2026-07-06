import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { proposalsApi, type Proposal } from '../../services/api'
import { isProposalPendingReview } from '../../services/filters'
import ProposalListView from '../../components/proposals/ProposalListView'

export default function ProposalReviewPage() {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProposals(await proposalsApi.list())
    } catch (e: any) {
      setError(e?.message || '无法加载待评估列表')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const submitted = useMemo(
    () => proposals.filter(isProposalPendingReview),
    [proposals]
  )

  return (
    <ProposalListView
      title="待企划作品评估"
      subtitle={`${submitted.length} 份待评估`}
      proposals={submitted}
      loading={loading}
      error={error}
      emptyText="暂无待企划作品。创意组提交后将在此出现。"
      onOpen={id => navigate(`/planning/proposals/${id}`)}
    />
  )
}
