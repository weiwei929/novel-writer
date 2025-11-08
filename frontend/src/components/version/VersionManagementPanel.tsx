import React, { useState } from 'react'
import { Chapter } from '../../services/api'
import VersionList from './VersionList'
import VersionSave from './VersionSave'
import VersionCompare from './VersionCompare'
import ChapterMetadataPanel from '../editor/ChapterMetadataPanel'
import { 
  History, 
  Save, 
  GitCompare, 
  FileText, 
  Settings
} from 'lucide-react'

interface VersionManagementPanelProps {
  chapter?: Chapter | null
  className?: string
}

const VersionManagementPanel: React.FC<VersionManagementPanelProps> = ({
  chapter,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'history' | 'compare' | 'metadata'>('save')

  const tabs = [
    {
      id: 'save' as const,
      icon: Save,
      label: '保存',
      description: '创建新版本'
    },
    {
      id: 'history' as const,
      icon: History,
      label: '历史',
      description: '版本历史'
    },
    {
      id: 'compare' as const,
      icon: GitCompare,
      label: '对比',
      description: '版本对比'
    },
    {
      id: 'metadata' as const,
      icon: FileText,
      label: '元数据',
      description: '章节信息'
    }
  ]

  return (
    <div className={`bg-purple-50 border-l border-purple-200 shadow-lg flex-shrink-0 w-80 ${className}`}>
      {/* 头部标题 */}
      <div className="p-4 border-b border-purple-200 bg-purple-100">
        <div className="flex items-center space-x-2">
          <Settings size={18} className="text-purple-600" />
          <h3 className="font-medium text-purple-900">审阅模式</h3>
        </div>
        <p className="text-xs text-purple-600 mt-1">版本管理与内容审查</p>
      </div>

      {/* 标签栏 */}
      <div className="border-b border-purple-200 bg-white">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  p-3 text-center border-r border-purple-100 last:border-r-0 transition-colors
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500' 
                    : 'text-purple-600 hover:bg-purple-50'
                  }
                `}
                title={tab.description}
              >
                <IconComponent size={16} className="mx-auto mb-1" />
                <div className="text-xs font-medium">{tab.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden bg-white">
        {activeTab === 'save' && (
          <div className="h-full overflow-y-auto">
            <VersionSave 
              compact={false}
              className="p-4"
              onVersionCreated={() => {
                // 版本创建成功后，切换到历史标签查看
                setActiveTab('history')
              }}
            />
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto">
            <VersionList 
              className="p-4"
              showActions={true}
              onVersionSelect={(version) => {
                console.log('选择版本:', version)
                // 可以在这里处理版本选择，比如预览或恢复
              }}
              onCompareSelect={(version) => {
                console.log('对比版本:', version)
                setActiveTab('compare')
              }}
            />
          </div>
        )}
        
        {activeTab === 'compare' && (
          <div className="h-full overflow-y-auto">
            <VersionCompare 
              className="p-4"
              onVersionSelect={(version, side) => {
                console.log('版本对比选择:', version, side)
              }}
            />
          </div>
        )}
        
        {activeTab === 'metadata' && (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-purple-900 mb-2">章节元数据</h4>
                <p className="text-sm text-purple-600">管理当前章节的详细信息</p>
              </div>
              
              <ChapterMetadataPanel 
                chapter={chapter || null}
                onUpdate={(field: string, value: string) => {
                  console.log('元数据更新:', field, value)
                  // 这里可以处理元数据更新逻辑
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏（可选） */}
      <div className="border-t border-purple-200 p-3 bg-purple-50">
        <div className="text-xs text-purple-600 text-center">
          {activeTab === 'save' && '创建项目版本快照'}
          {activeTab === 'history' && '浏览版本历史记录'}
          {activeTab === 'compare' && '对比不同版本差异'}
          {activeTab === 'metadata' && '编辑章节详细信息'}
        </div>
      </div>
    </div>
  )
}

export default VersionManagementPanel