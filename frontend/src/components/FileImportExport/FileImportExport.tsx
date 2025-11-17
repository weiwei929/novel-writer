import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { saveAs } from 'file-saver'
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  File as FileIcon,
  FileText as DocIcon,
  FileDown as PdfIcon,
  Type as TextIcon,
  Database as JsonIcon,
  Archive as ZipIcon,
  Check as CheckIcon,
  X as ErrorIcon,
  Info as InfoIcon,
  Loader2 as LoaderIcon
} from 'lucide-react'
import { collectionsApi, Collection } from '../../services/api'

interface FileImportExportProps {
  projectId?: string
  collectionId?: string
  onImportComplete?: () => void
}

interface ImportResult {
  success: boolean
  data?: {
    collections?: number
    projects?: number
    chapters?: number
  }
  message?: string
  error?: string
}

interface FileFormat {
  key: string
  name: string
  extension: string
  description: string
  icon: React.ReactNode
}

const IMPORT_FORMATS: FileFormat[] = [
  { key: 'docx', name: 'Word 文档', extension: '.docx', description: '支持导入 Word 文档中的文本内容', icon: <DocIcon className="w-4 h-4" /> },
  { key: 'txt', name: '文本文件', extension: '.txt', description: '支持纯文本文件导入', icon: <TextIcon className="w-4 h-4" /> },
  { key: 'md', name: 'Markdown 文件', extension: '.md', description: '支持 Markdown 格式文件导入', icon: <TextIcon className="w-4 h-4" /> },
  { key: 'json', name: '数据库文件', extension: '.json', description: '支持从 JSON 格式的数据库备份导入', icon: <JsonIcon className="w-4 h-4" /> },
  { key: 'zip', name: '备份压缩包', extension: '.zip', description: '支持从完整备份压缩包恢复', icon: <ZipIcon className="w-4 h-4" /> }
]

const EXPORT_FORMATS: FileFormat[] = [
  { key: 'word', name: 'Word 文档', extension: '.docx', description: '导出为格式化的 Word 文档', icon: <DocIcon className="w-4 h-4" /> },
  { key: 'pdf', name: 'PDF 文档', extension: '.pdf', description: '导出为 PDF 文档', icon: <PdfIcon className="w-4 h-4" /> },
  { key: 'text', name: '文本文件', extension: '.txt', description: '导出为纯文本文件', icon: <TextIcon className="w-4 h-4" /> },
  { key: 'markdown', name: 'Markdown 文件', extension: '.md', description: '导出为 Markdown 格式', icon: <TextIcon className="w-4 h-4" /> },
  { key: 'json', name: '数据库备份', extension: '.json', description: '导出完整数据库为 JSON 格式', icon: <JsonIcon className="w-4 h-4" /> }
]

const FileImportExport: React.FC<FileImportExportProps> = ({
  projectId,
  collectionId,
  onImportComplete
}) => {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [exportFormat, setExportFormat] = useState<string>('word')
  const [showFormatDialog, setShowFormatDialog] = useState(false)
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
  const [targetCollectionId, setTargetCollectionId] = useState<string>(collectionId || '')
  const [createNewCollection, setCreateNewCollection] = useState<boolean>(false)
  const [mergeStrategy, setMergeStrategy] = useState<'replace'|'merge'|'skip'>('merge')

  useEffect(() => {
    (async () => {
      try {
        const cols = await collectionsApi.getAll()
        setAvailableCollections(cols)
      } catch {}
    })()
  }, [])

  // 文件拖拽处理
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const formData = new FormData()
    formData.append('file', file)
    const cid = targetCollectionId || collectionId || ''
    if (cid) formData.append('collectionId', cid)
    formData.append('createNewCollection', String(createNewCollection))
    formData.append('mergeStrategy', mergeStrategy)

    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/v1/files/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()
      
      if (result.success) {
        setImportResult(result)
        onImportComplete?.()
      } else {
        setImportResult({ success: false, error: result.error || '导入失败' })
      }
    } catch (error) {
      console.error('导入错误:', error)
      setImportResult({ 
        success: false, 
        error: error instanceof Error ? error.message : '导入失败' 
      })
    } finally {
      setImporting(false)
    }
  }, [collectionId, onImportComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'application/zip': ['.zip']
    },
    maxFiles: 1,
    disabled: importing
  })

  // 导出处理
  const handleExport = async (format: string, id?: string) => {
    if (!projectId && !collectionId && !id) {
      alert('请选择要导出的项目或合集')
      return
    }

    setExporting(true)

    try {
      let url: string
      if (collectionId || (id && id.startsWith('collection-'))) {
        const cId = collectionId || id?.replace('collection-', '')
        url = `/api/v1/files/export-collection/${format}/${cId}`
      } else {
        const pId = projectId || id
        url = `/api/v1/files/export/${format}/${pId}`
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const formatInfo = EXPORT_FORMATS.find(f => f.key === format)
        const filename = `export-${Date.now()}${formatInfo?.extension || '.txt'}`
        saveAs(blob, filename)
      } else {
        const error = await response.json()
        alert(`导出失败: ${error.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('导出错误:', error)
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setExporting(false)
    }
  }



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">文件导入导出</h1>
        <p className="text-gray-600">管理您的小说数据，支持多种格式的导入和导出</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 导入区域 */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <UploadIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">文件导入</h2>
            </div>
          </div>

          <div className="p-6">
            {/* 目标文集与合并策略 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导入到文集</label>
                <select
                  value={targetCollectionId}
                  onChange={(e)=>setTargetCollectionId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">未选择（允许创建新文集）</option>
                  {availableCollections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <input id="createNewCollection" type="checkbox" checked={createNewCollection} onChange={(e)=>setCreateNewCollection(e.target.checked)} />
                  <label htmlFor="createNewCollection" className="text-sm text-gray-700">若未选择现有文集，则创建新文集</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">合并策略</label>
                <select
                  value={mergeStrategy}
                  onChange={(e)=>setMergeStrategy(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="replace">替换</option>
                  <option value="merge">合并</option>
                  <option value="skip">跳过</option>
                </select>
              </div>
            </div>
            {/* 拖拽区域 */}
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
                ${importing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <input {...getInputProps()} />
              
              {importing ? (
                <div className="space-y-4">
                  <LoaderIcon className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">正在导入文件...</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {isDragActive ? '释放文件以开始导入' : '拖拽文件到此处或点击选择'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      支持 .docx, .txt, .md, .json, .zip 格式
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      最大文件大小: 50MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 导入结果 */}
            {importResult && (
              <div className={`
                mt-4 p-4 rounded-lg border
                ${importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
                }
              `}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <ErrorIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {importResult.success ? '导入成功' : '导入失败'}
                    </h4>
                    {importResult.data && (
                      <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        合集: {importResult.data.collections || 0} | 
                        项目: {importResult.data.projects || 0} | 
                        章节: {importResult.data.chapters || 0}
                      </p>
                    )}
                    {importResult.error && (
                      <p className="text-sm text-red-700 mt-1">
                        {importResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 支持的导入格式 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">支持的导入格式:</h4>
              <div className="space-y-2">
                {IMPORT_FORMATS.map((format) => (
                  <div key={format.key} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="mt-1">{format.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{format.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {format.extension}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 导出区域 */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <DownloadIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">文件导出</h2>
            </div>
          </div>
          
          <div className="p-6">
            {/* 格式选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择导出格式
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={exporting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {EXPORT_FORMATS.map((format) => (
                  <option key={format.key} value={format.key}>
                    {format.name} ({format.extension})
                  </option>
                ))}
              </select>
            </div>

            {/* 主导出按钮 */}
            <button
              onClick={() => handleExport(exportFormat)}
              disabled={exporting || (!projectId && !collectionId)}
              className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  导出为 {EXPORT_FORMATS.find(f => f.key === exportFormat)?.name}
                </>
              )}
            </button>

            {/* 格式说明按钮 */}
            <button
              onClick={() => setShowFormatDialog(true)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <FileIcon className="w-4 h-4" />
              查看格式说明
            </button>

            {/* 快速导出 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">快速导出:</h4>
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_FORMATS.slice(0, 4).map((format) => (
                  <button
                    key={format.key}
                    onClick={() => handleExport(format.key)}
                    disabled={exporting || (!projectId && !collectionId)}
                    className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {format.icon}
                    {format.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 格式说明对话框 */}
      {showFormatDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">支持的文件格式说明</h3>
                <button
                  onClick={() => setShowFormatDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ErrorIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 导入格式 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">导入格式</h4>
                <div className="space-y-3">
                  {IMPORT_FORMATS.map((format) => (
                    <div key={format.key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {format.icon}
                      <div>
                        <div className="font-medium text-gray-900">
                          {format.name} ({format.extension})
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 导出格式 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">导出格式</h4>
                <div className="space-y-3">
                  {EXPORT_FORMATS.map((format) => (
                    <div key={format.key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {format.icon}
                      <div>
                        <div className="font-medium text-gray-900">
                          {format.name} ({format.extension})
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 使用说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">使用说明:</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Word 文档导入时会自动提取文本内容并按标题分割章节</li>
                      <li>• Markdown 文件支持标准格式，自动识别章节结构</li>
                      <li>• 文Text文件将作为单个章节导入到新项目</li>
                      <li>• JSON 和 ZIP 备份文件可完整恢复所有数据</li>
                      <li>• 导出时会保持原有的格式和结构</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFormatDialog(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileImportExport