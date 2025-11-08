import React, { useState } from 'react'
import { VersionType } from '../../types/version'
import { useVersionManagement } from '../../contexts/VersionManagementContext'
import { Save, Star, Camera, Clock, Plus } from 'lucide-react'

interface VersionSaveProps {
  className?: string
  onVersionCreated?: () => void
  compact?: boolean
}

const VersionSave: React.FC<VersionSaveProps> = ({
  className = '',
  onVersionCreated,
  compact = false
}) => {
  const { 
    state,
    createManualVersion, 
    createMilestone, 
    createSnapshot,
    createAutoSave
  } = useVersionManagement()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: VersionType.MANUAL,
    displayName: '',
    description: '',
    branchName: ''
  })

  // 版本类型配置
  const versionTypeOptions = [
    {
      type: VersionType.MANUAL,
      icon: Save,
      label: '手动保存',
      description: '保存当前项目状态',
      color: 'blue',
      shortcut: 'Ctrl+S'
    },
    {
      type: VersionType.MILESTONE,
      icon: Star,
      label: '里程碑',
      description: '标记重要的项目节点',
      color: 'yellow',
      shortcut: 'Ctrl+M'
    },
    {
      type: VersionType.SNAPSHOT,
      icon: Camera,
      label: '快照',
      description: '创建实验性分支',
      color: 'purple',
      shortcut: 'Ctrl+Shift+S'
    }
  ]

  // 重置表单
  const resetForm = () => {
    setCreateForm({
      type: VersionType.MANUAL,
      displayName: '',
      description: '',
      branchName: ''
    })
  }

  // 快速手动保存
  const handleQuickSave = async () => {
    const now = new Date()
    const version = await createManualVersion({
      displayName: `手动保存 ${now.toLocaleString('zh-CN')}`,
      description: '快速手动保存'
    })

    if (version && onVersionCreated) {
      onVersionCreated()
    }
  }

  // 创建自动保存
  const handleAutoSave = async () => {
    const version = await createAutoSave()
    if (version && onVersionCreated) {
      onVersionCreated()
    }
  }

  // 打开创建对话框
  const openCreateDialog = (type?: VersionType) => {
    if (type) {
      setCreateForm(prev => ({ ...prev, type }))
    }
    setShowCreateDialog(true)
  }

  // 关闭创建对话框
  const closeCreateDialog = () => {
    setShowCreateDialog(false)
    resetForm()
  }

  // 处理版本创建
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault()

    let version = null
    
    switch (createForm.type) {
      case VersionType.MANUAL:
        version = await createManualVersion({
          displayName: createForm.displayName || undefined,
          description: createForm.description || undefined
        })
        break
        
      case VersionType.MILESTONE:
        if (!createForm.displayName.trim()) {
          alert('请输入里程碑名称')
          return
        }
        version = await createMilestone(
          createForm.displayName, 
          createForm.description || undefined
        )
        break
        
      case VersionType.SNAPSHOT:
        if (!createForm.branchName.trim()) {
          alert('请输入分支名称')
          return
        }
        version = await createSnapshot(
          createForm.branchName, 
          createForm.description || undefined
        )
        break
    }

    if (version) {
      closeCreateDialog()
      if (onVersionCreated) {
        onVersionCreated()
      }
    }
  }

  if (compact) {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {/* 快速保存按钮 */}
        <button
          onClick={handleQuickSave}
          disabled={state.isSaving}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="快速手动保存 (Ctrl+S)"
        >
          <Save size={16} />
          <span>{state.isSaving ? '保存中...' : '保存'}</span>
        </button>

        {/* 更多选项按钮 */}
        <button
          onClick={() => openCreateDialog()}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          title="更多保存选项"
        >
          <Plus size={16} />
        </button>

        {/* 创建对话框 */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-medium text-gray-900 mb-4">创建新版本</h3>
              
              <form onSubmit={handleCreateVersion} className="space-y-4">
                {/* 版本类型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    版本类型
                  </label>
                  <div className="space-y-2">
                    {versionTypeOptions.map(option => {
                      const IconComponent = option.icon
                      const isSelected = createForm.type === option.type
                      
                      return (
                        <label
                          key={option.type}
                          className={`
                            flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                            ${isSelected 
                              ? `border-${option.color}-200 bg-${option.color}-50` 
                              : 'border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            value={option.type}
                            checked={isSelected}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              type: e.target.value as VersionType 
                            }))}
                            className="sr-only"
                          />
                          <IconComponent 
                            size={20} 
                            className={`mr-3 ${isSelected ? `text-${option.color}-500` : 'text-gray-400'}`} 
                          />
                          <div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* 版本名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {createForm.type === VersionType.SNAPSHOT ? '分支名称' : '版本名称'}
                    {createForm.type !== VersionType.MANUAL && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={createForm.type === VersionType.SNAPSHOT ? createForm.branchName : createForm.displayName}
                    onChange={(e) => {
                      if (createForm.type === VersionType.SNAPSHOT) {
                        setCreateForm(prev => ({ ...prev, branchName: e.target.value }))
                      } else {
                        setCreateForm(prev => ({ ...prev, displayName: e.target.value }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      createForm.type === VersionType.MILESTONE ? '输入里程碑名称...' :
                      createForm.type === VersionType.SNAPSHOT ? '输入分支名称...' :
                      '输入版本名称（可选）...'
                    }
                  />
                </div>

                {/* 版本描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    版本描述
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="描述此版本的主要变更（可选）..."
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={state.isSaving}
                    className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {state.isSaving ? '创建中...' : '创建版本'}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateDialog}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">版本保存</h3>
        
        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 快速手动保存 */}
          <button
            onClick={handleQuickSave}
            disabled={state.isSaving}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={24} className="text-blue-500" />
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {state.isSaving ? '保存中...' : '快速保存'}
              </div>
              <div className="text-sm text-gray-500">创建手动保存版本</div>
            </div>
          </button>

          {/* 自动保存 */}
          <button
            onClick={handleAutoSave}
            disabled={state.isSaving}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock size={24} className="text-gray-500" />
            <div className="text-left">
              <div className="font-medium text-gray-900">自动保存</div>
              <div className="text-sm text-gray-500">创建自动保存版本</div>
            </div>
          </button>
        </div>

        {/* 高级选项 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">高级选项</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 里程碑 */}
            <button
              onClick={() => openCreateDialog(VersionType.MILESTONE)}
              disabled={state.isSaving}
              className="flex items-center justify-center space-x-3 p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={24} className="text-yellow-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">创建里程碑</div>
                <div className="text-sm text-gray-500">标记重要节点</div>
              </div>
            </button>

            {/* 快照/分支 */}
            <button
              onClick={() => openCreateDialog(VersionType.SNAPSHOT)}
              disabled={state.isSaving}
              className="flex items-center justify-center space-x-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={24} className="text-purple-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">创建快照</div>
                <div className="text-sm text-gray-500">实验性分支</div>
              </div>
            </button>
          </div>
        </div>

        {/* 当前版本信息 */}
        {state.currentVersion && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-medium text-gray-900 mb-2">当前版本</h4>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-sm">
                {state.currentVersion.displayName || '未命名版本'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(state.currentVersion.createdAt).toLocaleString('zh-CN')} · 
                {state.currentVersion.totalWordCount.toLocaleString()} 字 · 
                {state.currentVersion.totalChapters} 章
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-medium text-gray-900 mb-4">创建新版本</h3>
            
            <form onSubmit={handleCreateVersion} className="space-y-4">
              {/* 版本类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本类型
                </label>
                <div className="space-y-2">
                  {versionTypeOptions.map(option => {
                    const IconComponent = option.icon
                    const isSelected = createForm.type === option.type
                    
                    return (
                      <label
                        key={option.type}
                        className={`
                          flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                          ${isSelected 
                            ? `border-${option.color}-200 bg-${option.color}-50` 
                            : 'border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          value={option.type}
                          checked={isSelected}
                          onChange={(e) => setCreateForm(prev => ({ 
                            ...prev, 
                            type: e.target.value as VersionType 
                          }))}
                          className="sr-only"
                        />
                        <IconComponent 
                          size={20} 
                          className={`mr-3 ${isSelected ? `text-${option.color}-500` : 'text-gray-400'}`} 
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 版本名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {createForm.type === VersionType.SNAPSHOT ? '分支名称' : '版本名称'}
                  {createForm.type !== VersionType.MANUAL && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={createForm.type === VersionType.SNAPSHOT ? createForm.branchName : createForm.displayName}
                  onChange={(e) => {
                    if (createForm.type === VersionType.SNAPSHOT) {
                      setCreateForm(prev => ({ ...prev, branchName: e.target.value }))
                    } else {
                      setCreateForm(prev => ({ ...prev, displayName: e.target.value }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    createForm.type === VersionType.MILESTONE ? '输入里程碑名称...' :
                    createForm.type === VersionType.SNAPSHOT ? '输入分支名称...' :
                    '输入版本名称（可选）...'
                  }
                />
              </div>

              {/* 版本描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  版本描述
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述此版本的主要变更（可选）..."
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={state.isSaving}
                  className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {state.isSaving ? '创建中...' : '创建版本'}
                </button>
                <button
                  type="button"
                  onClick={closeCreateDialog}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersionSave