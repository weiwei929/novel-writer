import type { Project } from '../../services/api'
import { getProjectStatusLabel, type PhaseContext } from '../../services/statusLabels'

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  planning: 'bg-blue-50 text-blue-600 border-blue-200',
  planned: 'bg-sky-50 text-sky-700 border-sky-200',
  writing: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  written: 'bg-amber-50 text-amber-700 border-amber-200',
  reviewing: 'bg-amber-50 text-amber-600 border-amber-200',
  reviewed: 'bg-green-50 text-green-600 border-green-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function ProjectStatusBadge({
  status,
  phase,
}: {
  status: Project['status']
  phase?: PhaseContext
}) {
  const label = getProjectStatusLabel(status, phase || 'studio')
  const cls = STATUS_CLS[status] ?? STATUS_CLS.draft
  return <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{label}</span>
}
