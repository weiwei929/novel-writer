import type { Proposal } from '../../services/api'
import { PROPOSAL_STATUS_LABEL } from '../../services/api'

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  submitted: 'bg-blue-50 text-blue-600 border-blue-200',
  evaluated: 'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-green-50 text-green-600 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  shelved: 'bg-red-50 text-red-600 border-red-200',
}

export default function ProposalStatusBadge({ status }: { status: Proposal['status'] }) {
  const label = PROPOSAL_STATUS_LABEL[status] ?? status
  const cls = STATUS_CLS[status] ?? STATUS_CLS.draft
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{label}</span>
  )
}
