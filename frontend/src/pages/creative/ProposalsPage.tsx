import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { proposalsApi, type Proposal } from '../../services/api'
import { useUIStore } from '../../stores/uiStore'
import ProposalListView from '../../components/proposals/ProposalListView'

export default function ProposalsPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProposals(await proposalsApi.list())
    } catch (e: any) {
      setError(e?.message || '无法加载企划建议书列表')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    try {
      const created = await proposalsApi.create({ title: '未命名企划建议书' })
      navigate(`/creative/proposals/${created.id}`)
    } catch {
      addNotification({ type: 'error', title: '创建失败', message: '无法创建企划建议书' })
    }
  }

  return (
    <ProposalListView
      title="企划建议书"
      subtitle={`${proposals.length} 份`}
      proposals={proposals}
      loading={loading}
      error={error}
      emptyText='还没有企划建议书，点击右上角"新建企划建议书"开始。'
      onOpen={id => navigate(`/creative/proposals/${id}`)}
      onCreate={handleCreate}
    />
  )
}
