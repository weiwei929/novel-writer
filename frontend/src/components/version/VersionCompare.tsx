import React, { useState, useEffect } from 'react'
import { VersionComparison, ProjectVersion } from '../../types/version'
import { useVersionManagement } from '../../contexts/VersionManagementContext'
import { versionUtils } from '../../services/versionApi'
import { 
  ArrowRight, 
  Plus, 
  Minus, 
  Edit, 
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface VersionCompareProps {
  className?: string
  fromVersion?: ProjectVersion | null
  toVersion?: ProjectVersion | null
  onVersionSelect?: (version: ProjectVersion, side: 'from' | 'to') => void
}

const VersionCompare: React.FC<VersionCompareProps> = ({
  className = '',
  fromVersion,
  toVersion,
  onVersionSelect
}) => {
  const { state, compareVersions, compareWithCurrent, clearComparison } = useVersionManagement()
  const [selectedFromVersion, setSelectedFromVersion] = useState<ProjectVersion | null>(fromVersion || null)
  const [selectedToVersion, setSelectedToVersion] = useState<ProjectVersion | null>(toVersion || null)
  const [isComparing, setIsComparing] = useState(false)
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['project', 'chapters']))

  useEffect(() => {
    if (fromVersion) setSelectedFromVersion(fromVersion)
    if (toVersion) setSelectedToVersion(toVersion)
  }, [fromVersion, toVersion])

  // 自动比较
  useEffect(() => {
    if (selectedFromVersion && selectedToVersion && selectedFromVersion.id !== selectedToVersion.id) {
      handleCompare()
    }
  }, [selectedFromVersion, selectedToVersion])

  const handleCompare = async () => {
    if (!selectedFromVersion || !selectedToVersion) return

    setIsComparing(true)
    try {
      let result: VersionComparison | null = null
      
      if (selectedToVersion.id === 'current') {
        result = await compareWithCurrent(selectedFromVersion.id)
      } else {
        result = await compareVersions(selectedFromVersion.id, selectedToVersion.id)
      }
      
      setComparison(result)
    } catch (error) {
      console.error('版本比较失败:', error)
    } finally {
      setIsComparing(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const formatVersionName = (version: ProjectVersion) => {
    return version.displayName || versionUtils.formatVersionName(version)
  }

  const getChangeTypeColor = (type: 'create' | 'update' | 'delete') => {
    switch (type) {
      case 'create': return 'text-green-600 bg-green-50 border-green-200'
      case 'update': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'delete': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getChangeIcon = (type: 'create' | 'update' | 'delete') => {
    switch (type) {
      case 'create': return Plus
      case 'update': return Edit
      case 'delete': return Minus
      default: return FileText
    }
  }

  return (
    <div className={className}>
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* 头部：版本选择 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">版本对比</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* 源版本选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">源版本</label>
              <select
                value={selectedFromVersion?.id || ''}
                onChange={(e) => {
                  const version = state.versions.find(v => v.id === e.target.value)
                  setSelectedFromVersion(version || null)
                  if (onVersionSelect && version) {
                    onVersionSelect(version, 'from')
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择源版本</option>
                {state.versions.map(version => (
                  <option key={version.id} value={version.id}>
                    {formatVersionName(version)}
                  </option>
                ))}
              </select>
            </div>

            {/* 对比箭头 */}
            <div className="flex justify-center">
              <ArrowRight size={24} className="text-gray-400" />
            </div>

            {/* 目标版本选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">目标版本</label>
              <select
                value={selectedToVersion?.id || ''}
                onChange={(e) => {
                  if (e.target.value === 'current') {
                    setSelectedToVersion({ 
                      id: 'current', 
                      displayName: '当前状态' 
                    } as ProjectVersion)
                  } else {
                    const version = state.versions.find(v => v.id === e.target.value)
                    setSelectedToVersion(version || null)
                    if (onVersionSelect && version) {
                      onVersionSelect(version, 'to')
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择目标版本</option>
                <option value="current">当前状态</option>
                {state.versions.map(version => (
                  <option key={version.id} value={version.id}>
                    {formatVersionName(version)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 比较按钮 */}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleCompare}
              disabled={!selectedFromVersion || !selectedToVersion || isComparing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComparing ? '比较中...' : '开始对比'}
            </button>
            
            {comparison && (
              <button
                onClick={() => {
                  setComparison(null)
                  clearComparison()
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                清除对比
              </button>
            )}
          </div>
        </div>

        {/* 比较结果 */}
        {comparison && (
          <div className="p-6">
            {/* 概述 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">对比概述</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-2xl font-bold text-green-600">{comparison.addedChapters.length}</div>
                  <div className="text-sm text-green-700">新增章节</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="text-2xl font-bold text-blue-600">{comparison.modifiedChapters.length}</div>
                  <div className="text-sm text-blue-700">修改章节</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-2xl font-bold text-red-600">{comparison.removedChapters.length}</div>
                  <div className="text-sm text-red-700">删除章节</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-2xl font-bold text-gray-600">{comparison.changes.length}</div>
                  <div className="text-sm text-gray-700">总变更</div>
                </div>
              </div>
            </div>

            {/* 项目级变更 */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('project')}
                className="flex items-center space-x-2 w-full text-left font-medium text-gray-900 hover:text-gray-700"
              >
                {expandedSections.has('project') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span>项目信息变更</span>
                {Object.keys(comparison.projectChanges || {}).length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {Object.keys(comparison.projectChanges || {}).length} 项
                  </span>
                )}
              </button>

              {expandedSections.has('project') && comparison.projectChanges && (
                <div className="mt-3 pl-6 space-y-3">
                  {Object.entries(comparison.projectChanges).map(([field, change]) => (
                    <div key={field} className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50">
                      <div className="font-medium text-blue-900 capitalize">{field}</div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-red-600 font-medium">原值:</span>
                          <div className="text-gray-700 mt-1 p-2 bg-red-50 rounded">
                            {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old)}
                          </div>
                        </div>
                        <div>
                          <span className="text-green-600 font-medium">新值:</span>
                          <div className="text-gray-700 mt-1 p-2 bg-green-50 rounded">
                            {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 章节变更 */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('chapters')}
                className="flex items-center space-x-2 w-full text-left font-medium text-gray-900 hover:text-gray-700"
              >
                {expandedSections.has('chapters') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span>章节变更</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {comparison.addedChapters.length + comparison.modifiedChapters.length + comparison.removedChapters.length} 项
                </span>
              </button>

              {expandedSections.has('chapters') && (
                <div className="mt-3 pl-6 space-y-4">
                  {/* 新增章节 */}
                  {comparison.addedChapters.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2 flex items-center space-x-2">
                        <Plus size={16} />
                        <span>新增章节 ({comparison.addedChapters.length})</span>
                      </h5>
                      <div className="space-y-2">
                        {comparison.addedChapters.map(chapter => (
                          <div key={chapter.id} className="border-l-4 border-green-200 pl-4 py-2 bg-green-50">
                            <div className="font-medium text-green-900">
                              第 {chapter.order} 章: {chapter.title}
                            </div>
                            <div className="text-sm text-green-700 mt-1">
                              {chapter.wordCount.toLocaleString()} 字 · 状态: {chapter.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 修改章节 */}
                  {comparison.modifiedChapters.length > 0 && (
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2 flex items-center space-x-2">
                        <Edit size={16} />
                        <span>修改章节 ({comparison.modifiedChapters.length})</span>
                      </h5>
                      <div className="space-y-2">
                        {comparison.modifiedChapters.map(({ chapter, changes }) => (
                          <div key={chapter.id} className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50">
                            <div className="font-medium text-blue-900">
                              第 {chapter.order} 章: {chapter.title}
                            </div>
                            <div className="mt-2 space-y-1">
                              {Object.entries(changes).map(([field, change]) => (
                                <div key={field} className="text-sm">
                                  <span className="font-medium text-blue-800 capitalize">{field}:</span>
                                  <span className="text-red-600 ml-2 line-through">{String(change.old)}</span>
                                  <span className="text-green-600 ml-2">{String(change.new)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 删除章节 */}
                  {comparison.removedChapters.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-700 mb-2 flex items-center space-x-2">
                        <Minus size={16} />
                        <span>删除章节 ({comparison.removedChapters.length})</span>
                      </h5>
                      <div className="space-y-2">
                        {comparison.removedChapters.map(chapter => (
                          <div key={chapter.id} className="border-l-4 border-red-200 pl-4 py-2 bg-red-50">
                            <div className="font-medium text-red-900">
                              第 {chapter.order} 章: {chapter.title}
                            </div>
                            <div className="text-sm text-red-700 mt-1">
                              {chapter.wordCount.toLocaleString()} 字 · 状态: {chapter.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 详细变更列表 */}
            <div>
              <button
                onClick={() => toggleSection('changes')}
                className="flex items-center space-x-2 w-full text-left font-medium text-gray-900 hover:text-gray-700"
              >
                {expandedSections.has('changes') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span>详细变更记录</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {comparison.changes.length}
                </span>
              </button>

              {expandedSections.has('changes') && (
                <div className="mt-3 pl-6">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {comparison.changes.map((change, index) => {
                      const IconComponent = getChangeIcon(change.type)
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-start space-x-3 p-3 border rounded ${getChangeTypeColor(change.type)}`}
                        >
                          <IconComponent size={16} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {change.summary}
                            </div>
                            <div className="text-sm opacity-75 mt-1">
                              {change.target}: {change.targetName}
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              {new Date(change.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!comparison && !isComparing && (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <p className="text-gray-500">选择两个版本进行对比</p>
            <p className="text-sm text-gray-400 mt-1">查看版本间的差异和变更</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionCompare