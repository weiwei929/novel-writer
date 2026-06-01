import { IconDelete, IconEdit, IconExternalLink } from '../ui/icons'
import type { Scrap } from '../../services/api'

interface ScrapCardProps {
  scrap: Scrap
  onEdit: (scrap: Scrap) => void
  onDelete: (id: string) => void
}

export default function ScrapCard({ scrap, onEdit, onDelete }: ScrapCardProps) {
  const tags: string[] = Array.isArray(scrap.tags) ? scrap.tags : []

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <div className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* 内容预览 */}
      <div className="flex-1">
        <p className="text-gray-800 text-sm whitespace-pre-wrap line-clamp-5 leading-relaxed">
          {scrap.content}
        </p>
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部信息栏 */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          {/* 作品归属 */}
          {scrap.project && (
            <span className="flex items-center gap-1 truncate max-w-[120px]" title={scrap.project.title}>
              <IconExternalLink size={12} />
              <span className="truncate">{scrap.project.title}</span>
            </span>
          )}
          {/* 备注指示 */}
          {scrap.note && (
            <span className="text-gray-300 truncate max-w-[100px]" title={scrap.note}>
              💬 {scrap.note}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <time>{timeAgo(scrap.createdAt)}</time>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(scrap)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
              title="编辑"
            >
              <IconEdit size={14} />
            </button>
            <button
              onClick={() => onDelete(scrap.id)}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="删除"
            >
              <IconDelete size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
