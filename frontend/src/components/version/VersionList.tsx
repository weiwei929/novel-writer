import React, { useState } from 'react'
import { ProjectVersion, VersionType, VersionStatus } from '../../types/version'
import { useVersionManagement } from '../../contexts/VersionManagementContext'
import { versionUtils } from '../../services/versionApi'
import { 
  Clock, 
  Save, 
  Star, 
  Camera, 
  MoreHorizontal, 
  ArrowLeft, 
  Trash2, 
  Archive, 
  Edit3, 
  GitCommit,
  RefreshCw
} from 'lucide-react'

interface VersionListProps {
  className?: string
  onVersionSelect?: (version: ProjectVersion) => void
  onCompareSelect?: (version: ProjectVersion) => void
  showActions?: boolean
}

const VersionList: React.FC<VersionListProps> = ({
  className = '',
  onVersionSelect,
  onCompareSelect,
  showActions = true
}) => {
  const { 
    state, 
    restoreVersion, 
    deleteVersion, 
    archiveVersion,
    updateVersionInfo,
    canRestoreVersion,
    canDeleteVersion,
    refreshVersions
  } = useVersionManagement()

  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [editingVersion, setEditingVersion] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', description: '' })

  // 版本类型图标配置
  const versionTypeConfig = {
    [VersionType.AUTO]: { 
      icon: Clock, 
      color: 'text-gray-500', 
      bgColor: 'bg-gray-100', 
      label: '自动保存' 
    },
    [VersionType.MANUAL]: { 
      icon: Save, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-100', 
      label: '手动保存' 
    },
    [VersionType.MILESTONE]: { 
      icon: Star, 
      color: 'text-yellow-500', 
      bgColor: 'bg-yellow-100', 
      label: '里程碑' 
    },
    [VersionType.SNAPSHOT]: { 
      icon: Camera, 
      color: 'text-purple-500', 
      bgColor: 'bg-purple-100', 
      label: '快照' 
    }
  }

  // 版本状态样式配置
  const statusConfig = {
    [VersionStatus.ACTIVE]: { color: 'text-green-600', bgColor: 'bg-green-100', label: '活跃' },
    [VersionStatus.ARCHIVED]: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: '已归档' },
    [VersionStatus.DEPRECATED]: { color: 'text-red-600', bgColor: 'bg-red-100', label: '已废弃' }
  }

  // 处理版本恢复
  const handleRestore = async (versionId: string) => {
    if (!canRestoreVersion(versionId)) return
    
    const confirmed = window.confirm('确定要恢复到此版本吗？这将创建当前状态的备份版本。')
    if (!confirmed) return

    const success = await restoreVersion(versionId, true)
    if (success) {
      setExpandedVersion(null)
    }
  }

  // 处理版本删除
  const handleDelete = async (versionId: string) => {
    if (!canDeleteVersion(versionId)) return
    
    const confirmed = window.confirm('确定要删除此版本吗？此操作不可恢复。')
    if (!confirmed) return

    const success = await deleteVersion(versionId)
    if (success) {
      setExpandedVersion(null)
    }
  }

  // 处理版本归档
  const handleArchive = async (versionId: string) => {
    const confirmed = window.confirm('确定要归档此版本吗？')
    if (!confirmed) return

    const success = await archiveVersion(versionId)
    if (success) {
      setExpandedVersion(null)
    }
  }

  // 开始编辑版本信息
  const startEdit = (version: ProjectVersion) => {
    setEditingVersion(version.id)
    setEditForm({
      displayName: version.displayName || '',
      description: version.description || ''
    })
  }

  // 保存编辑
  const saveEdit = async () => {
    if (!editingVersion) return

    const success = await updateVersionInfo(editingVersion, editForm)
    if (success) {
      setEditingVersion(null)
      setEditForm({ displayName: '', description: '' })
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingVersion(null)
    setEditForm({ displayName: '', description: '' })
  }

  // 格式化版本时间
  const formatVersionTime = (version: ProjectVersion) => {
    const date = new Date(version.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays}天前`
    if (diffHours > 0) return `${diffHours}小时前`
    if (diffMinutes > 0) return `${diffMinutes}分钟前`
    return '刚刚'
  }

  if (state.isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">加载版本历史...</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-red-600 mb-4">加载版本历史失败: {state.error}</p>
        <button
          onClick={refreshVersions}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 mx-auto"
        >
          <RefreshCw size={16} />
          <span>重新加载</span>
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 头部 */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">版本历史</h3>
          <button
            onClick={refreshVersions}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="刷新版本列表"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        {state.versionStats && (
          <div className="flex space-x-4 text-sm text-gray-500 mt-2">
            <span>总计 {state.versionStats.totalVersions} 个版本</span>
            <span>手动 {state.versionStats.manualSaveCount}</span>
            <span>里程碑 {state.versionStats.milestoneCount}</span>
          </div>
        )}
      </div>

      {/* 版本列表 */}
      <div className="space-y-2">
        {state.versions.map((version) => {
          const typeConfig = versionTypeConfig[version.type]
          const statusConf = statusConfig[version.status]
          const IconComponent = typeConfig.icon
          const isExpanded = expandedVersion === version.id
          const isEditing = editingVersion === version.id
          const isCurrent = state.currentVersion?.id === version.id

          return (
            <div 
              key={version.id}
              className={`
                border rounded-lg transition-all duration-200
                ${isCurrent 
                  ? 'border-green-200 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:shadow-sm'
                }
                ${isExpanded ? 'shadow-lg' : ''}
              `}
            >
              {/* 版本基本信息 */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => {
                  if (onVersionSelect) {
                    onVersionSelect(version)
                  } else {
                    setExpandedVersion(isExpanded ? null : version.id)
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* 版本类型图标 */}
                    <div className={`p-2 rounded-full ${typeConfig.bgColor}`}>
                      <IconComponent size={16} className={typeConfig.color} />
                    </div>

                    {/* 版本信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {version.displayName || versionUtils.formatVersionName(version)}
                        </h4>
                        
                        {isCurrent && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            当前版本
                          </span>
                        )}
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConf.bgColor} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      
                      {version.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {version.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center space-x-1">
                          <GitCommit size={12} />
                          <span>{version.versionNumber}</span>
                        </span>
                        <span>{formatVersionTime(version)}</span>
                        <span>{version.totalWordCount.toLocaleString()} 字</span>
                        <span>{version.totalChapters} 章</span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {showActions && (
                    <div className="flex items-center space-x-1">
                      {onCompareSelect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onCompareSelect(version)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                          title="对比版本"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedVersion(isExpanded ? null : version.id)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="展开详情"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 展开的详细信息和操作 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {isEditing ? (
                    // 编辑模式
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          显示名称
                        </label>
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="版本显示名称"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          版本描述
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="描述此版本的主要变更..."
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 查看模式
                    <div className="space-y-4">
                      {/* 详细信息 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">创建时间:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(version.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">版本类型:</span>
                          <span className="ml-2 text-gray-900">{typeConfig.label}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">总字数:</span>
                          <span className="ml-2 text-gray-900">{version.totalWordCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">章节数:</span>
                          <span className="ml-2 text-gray-900">{version.totalChapters}</span>
                        </div>
                        {version.branchName && (
                          <div className="col-span-2">
                            <span className="text-gray-500">分支:</span>
                            <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {version.branchName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex space-x-2 pt-2 border-t border-gray-200">
                        {canRestoreVersion(version.id) && !isCurrent && (
                          <button
                            onClick={() => handleRestore(version.id)}
                            disabled={state.isRestoring}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            <ArrowLeft size={16} />
                            <span>恢复此版本</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => startEdit(version)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <Edit3 size={16} />
                          <span>编辑</span>
                        </button>
                        
                        {version.status === VersionStatus.ACTIVE && (
                          <button
                            onClick={() => handleArchive(version.id)}
                            className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            <Archive size={16} />
                            <span>归档</span>
                          </button>
                        )}
                        
                        {canDeleteVersion(version.id) && (
                          <button
                            onClick={() => handleDelete(version.id)}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                            <span>删除</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 空状态 */}
      {state.versions.length === 0 && (
        <div className="text-center p-8">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <p className="text-gray-500">还没有版本历史</p>
          <p className="text-sm text-gray-400 mt-1">保存项目后将自动创建版本记录</p>
        </div>
      )}
    </div>
  )
}

export default VersionList