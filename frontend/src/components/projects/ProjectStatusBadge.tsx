import type { Project } from '../../services/api'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  planning: { label: '企划中', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  writing: { label: '创作中', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  reviewing: { label: '审阅中', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  completed: { label: '已完成', cls: 'bg-green-50 text-green-600 border-green-200' },
  archived: { label: '已归档', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  imported: { label: '已导入', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  published: { label: '已发布', cls: 'bg-green-50 text-green-600 border-green-200' },
  pooled: { label: '审查池', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  trashed: { label: '回收站', cls: 'bg-red-50 text-red-600 border-red-200' },
}

export default function ProjectStatusBadge({ status }: { status: Project['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft
  return <span className={`text-xs px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
}
