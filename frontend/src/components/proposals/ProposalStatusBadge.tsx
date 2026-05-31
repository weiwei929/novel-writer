import type { Proposal } from '../../services/api'

const STATUS_META: Record<Proposal['status'], { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  submitted: { label: '已提交', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  evaluated: { label: '已评估', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  approved: { label: '已立项', cls: 'bg-green-50 text-green-600 border-green-200' },
  rejected: { label: '已驳回', cls: 'bg-red-50 text-red-600 border-red-200' },
}

export default function ProposalStatusBadge({ status }: { status: Proposal['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
  )
}
