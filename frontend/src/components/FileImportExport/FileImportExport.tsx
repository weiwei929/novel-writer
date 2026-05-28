import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { projectsApi } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { MetadataReviewModal } from '../import/MetadataReviewModal'
import { useNotifications } from '../../hooks/useNotifications'

export const FileImportExport: React.FC = () => {
    const navigate = useNavigate()
    const { success, error } = useNotifications()
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload')
    const [rawContent, setRawContent] = useState<string>('')  // 保存原始内容
    const [parsedData, setParsedData] = useState<{
        title: string;
        chapters: { title: string; content: string }[];
        stats: { wordCount: number; charCount: number };
        warnings: string[];
    } | null>(null)
    const [importError, setImportError] = useState<string | null>(null)
    
    // 元数据确认相关状态
    const [importedProjectId, setImportedProjectId] = useState<string | null>(null)
    const [showMetadataReview, setShowMetadataReview] = useState(false)
    const [extractedMetadata, setExtractedMetadata] = useState<any>(null)

    // Helper: Parse and Clean Text (仅用于预览)
    const processFile = async (file: File) => {
        const text = await file.text()
        setRawContent(text)  // 保存原始内容
        
        // 1. H1 Check (简单预检查)
        const h1Matches = text.match(/^#\s+[^\n]+/gm) || []
        
        // 2. Cleaning Pipeline (仅用于预览)
        let cleanText = text
            .replace(/^　+/gm, '') 
            .replace(/^[ \t]+/gm, '')
            .replace(/\n{3,}/g, '\n\n')

        // 3. Extraction (仅用于预览)
        let title = file.name.replace(/\.[^/.]+$/, "")
        if (h1Matches.length === 1) {
            title = h1Matches[0].replace(/^#\s+/, '').trim()
        }

        const parts = cleanText.split(/^##\s+/m)
        const chapters: { title: string; content: string }[] = []
        
        if (parts.length > 0) {
            let preamble = parts[0].trim()
            const h1 = h1Matches[0]
            if (h1) {
                 preamble = preamble.replace(h1, '').trim()
            }
            if (preamble) {
                chapters.push({ title: '序章 / 前言', content: preamble })
            }
        }

        for (let i = 1; i < parts.length; i++) {
            const lines = parts[i].split('\n')
            const chTitle = lines[0].trim()
            const chContent = lines.slice(1).join('\n').trim()
            if (chTitle || chContent) {
                chapters.push({ title: chTitle || `第 ${i} 节`, content: chContent })
            }
        }

        setParsedData({
            title,
            chapters,
            stats: { 
                wordCount: cleanText.length,
                charCount: cleanText.length 
            },
            warnings: []
        })
        setStep('preview')
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setImportError(null)
        if (acceptedFiles.length === 0) return
        const file = acceptedFiles[0]
        try {
            await processFile(file)
        } catch (e) {
            setImportError('文件解析失败，请检查格式')
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
        maxFiles: 1
    })

    const handleConfirmImport = async () => {
        if (!rawContent) return
        setStep('importing')
        setImportError(null) // 清除之前的错误
        try {
            const response = await projectsApi.importProject({
                content: rawContent
            })
            
            // 新的响应格式: { project, hasPendingMetadata }
            const { project, hasPendingMetadata } = response as any
            
            // 保存项目 ID
            setImportedProjectId(project.id)
            setStep('success')
            
            // 显示成功通知
            success(
                '导入成功！',
                `《${project.title}》已导入到暂存池，请在"外部导入"区域查看`
            )
            
            // 如果有待确认的元数据，等待一下让 AI 提取完成
            if (hasPendingMetadata) {
                // 轮询检查元数据是否提取完成
                const checkMetadata = async () => {
                    try {
                        const updatedProject = await projectsApi.getById(project.id)
                        if (updatedProject.metadata?._draft) {
                            setExtractedMetadata(updatedProject.metadata._draft)
                            setShowMetadataReview(true)
                        } else {
                            // 如果还没提取完成，2秒后再检查
                            setTimeout(checkMetadata, 2000)
                        }
                    } catch (err) {
                        console.error('Failed to check metadata:', err)
                    }
                }
                
                // 延迟3秒后开始检查（给 AI 一些处理时间）
                setTimeout(checkMetadata, 3000)
            }
        } catch (e: any) {
            // 详细日志来调试错误对象结构
            console.error('Import error - full object:', e)
            console.error('Import error - type:', typeof e)
            console.error('Import error - message:', e.message)
            console.error('Import error - constructor:', e.constructor?.name)
            
            // ApiError 已经被 handleApiError 处理过
            // 错误信息在 e.message 中
            const errorMessage = (typeof e === 'string' ? e : e.message) || '导入失败，请稍后重试'
            
            setImportError(errorMessage)
            setStep('preview')
            
            // 显示错误通知
            error(
                '导入失败',
                errorMessage,
                8000  // 8秒
            )
        }
    }
    
    const handleMetadataConfirm = () => {
        setShowMetadataReview(false)
        // 元数据已确认，可以继续
    }
    
    const handleMetadataReject = () => {
        setShowMetadataReview(false)
        // 元数据已拒绝，可以继续
    }

    // UI Renders...
    if (step === 'success') {
         return (
             <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                 <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-gray-800 mb-2">导入成功！</h2>
                 <p className="text-gray-600 mb-6">《{parsedData?.title}》已存入"导入文集"。</p>
                 <button onClick={() => navigate('/collections')} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                     去整理文集
                 </button>
             </div>
         )
    }

    if (step === 'preview' && parsedData) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center">
                    <div>
                         <h2 className="text-xl font-bold text-gray-900">预览导入内容</h2>
                         <p className="text-sm text-gray-600 mt-1">请确认书籍信息与章节结构，确认无误后点击导入</p>
                    </div>
                    <div className="space-x-3">
                        <button onClick={() => { setStep('upload'); setParsedData(null); }} className="px-4 py-2 text-gray-600 hover:bg-white rounded">取消</button>
                        <button onClick={handleConfirmImport} className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">确认导入</button>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Metadata */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">书名</label>
                            <input 
                                value={parsedData.title} 
                                onChange={(e) => setParsedData({...parsedData, title: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border rounded font-medium text-lg"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 space-y-2">
                             <div className="flex justify-between"><span>总字数:</span> <span className="font-mono">{parsedData.stats.wordCount}</span></div>
                             <div className="flex justify-between"><span>总章节:</span> <span className="font-mono">{parsedData.chapters.length}</span></div>
                        </div>
                    </div>
                    
                    {/* Chapter List */}
                    <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700">章节列表</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {parsedData.chapters.map((ch, i) => (
                                <div key={i} className="flex items-center px-3 py-2 hover:bg-blue-50 rounded group">
                                    <span className="w-8 text-xs text-gray-400 font-mono">{i+1}</span>
                                    <span className="flex-1 font-medium text-gray-800 truncate">{ch.title}</span>
                                    <span className="text-xs text-gray-400">{ch.content.length} 字</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-12">
            <h1 className="text-3xl font-bold text-center mb-2">导入小说</h1>
            <p className="text-center text-gray-500 mb-8">支持 Markdown 或 TXT 格式，自动识别章节结构</p>

            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400'}
                ${importError ? 'border-red-300 bg-red-50' : ''}
            `}>
                <input {...getInputProps()} />
                {step === 'importing' ? (
                     <div className="flex flex-col items-center">
                         <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                         <p className="text-lg font-medium">正在入库，请稍候...</p>
                     </div>
                ) : (
                    <>
                        {importError ? <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4"/> : <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
                        {importError ? (
                            <div className="text-red-600 font-medium mb-2">{importError}</div>
                        ) : (
                            <div className="text-gray-600 font-medium text-lg mb-2">拖拽文件到这里，或点击上传</div>
                        )}
                        <p className="text-sm text-gray-400">仅支持单文件导入 (.md, .txt)</p>
                    </>
                )}
            </div>
            
            <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-2">💡 智能清洗说明：</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>将自动去除行首的全角/半角空格</li>
                    <li>连续空行将被压缩</li>
                    <li>若检测到多个一级标题 (#)，将提示手动拆分</li>
                    <li>推荐使用 standard Markdown 格式 (## 章节名)</li>
                </ul>
            </div>
            
            {/* 元数据确认模态框 */}
            {importedProjectId && showMetadataReview && extractedMetadata && (
                <MetadataReviewModal
                    isOpen={showMetadataReview}
                    projectId={importedProjectId}
                    projectTitle={parsedData?.title || '未命名作品'}
                    extractedMetadata={extractedMetadata}
                    onConfirm={handleMetadataConfirm}
                    onReject={handleMetadataReject}
                    onClose={() => setShowMetadataReview(false)}
                />
            )}
        </div>
    )
}

export default FileImportExport
