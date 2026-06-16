import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  externalRefsApi,
  type ExternalRefAnnotation,
  type ExternalRefProcessingType,
  type FileReference,
} from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import { createOriginFromExternalRef } from '../../services/creativeOrigin'
import ThreeColumnLayout from './ThreeColumnLayout'
import TagInput, { TagFilterBar } from './TagInput'
import TypeLabel from './TypeLabel'

function getParagraphs(ref: FileReference): string[] {
  const fromMeta = ref.metadata?.paragraphs
  if (fromMeta?.length) return fromMeta
  if (!ref.fileContent) return []
  return ref.fileContent
    .split(/\n\n+|(?=^## )/m)
    .map(p => p.trim())
    .filter(Boolean)
}

function collectRefTags(refs: FileReference[]): string[] {
  const set = new Set<string>()
  for (const r of refs) {
    for (const t of r.tags || []) set.add(t)
  }
  return [...set].sort()
}

export default function ExternalRefs() {
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()
  const notifyErrorRef = useRef(notifyError)
  notifyErrorRef.current = notifyError
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [refs, setRefs] = useState<FileReference[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [creatingOrigin, setCreatingOrigin] = useState(false)

  const [partialMode, setPartialMode] = useState(false)
  const [selectedParagraphs, setSelectedParagraphs] = useState<number[]>([])
  const [annotationNote, setAnnotationNote] = useState('')
  const [annotationTags, setAnnotationTags] = useState<string[]>([])
  const [fileTags, setFileTags] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRefs(await externalRefsApi.getAll())
    } catch {
      notifyErrorRef.current('加载失败', '无法获取外来参考')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const allTags = useMemo(() => collectRefTags(refs), [refs])

  const selected = refs.find(r => r.id === selectedId)

  const listRefs = useMemo(() => {
    return refs.filter(r => {
      if (r.processingType !== 'none') return false
      if (activeTag && !(r.tags || []).includes(activeTag)) return false
      return true
    })
  }, [refs, activeTag])

  const type1Refs = refs.filter(r => r.processingType === 'complete')
  const type2Refs = refs.filter(r => r.processingType === 'partial')

  const selectRef = (ref: FileReference | null) => {
    setPartialMode(false)
    setSelectedParagraphs([])
    setAnnotationNote('')
    setAnnotationTags([])
    if (!ref) {
      setSelectedId(null)
      setFileTags([])
      return
    }
    setSelectedId(ref.id)
    setFileTags(ref.tags || [])
  }

  const importContent = async (fileName: string, content: string) => {
    setImporting(true)
    try {
      const created = await externalRefsApi.importFile(fileName, content)
      success('文件已导入')
      await load()
      selectRef(created)
    } catch {
      notifyError('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
      notifyError('格式不支持', '请导入 .md 或 .txt 文件')
      return
    }
    const content = await file.text()
    await importContent(file.name, content)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  const updateRef = async (
    id: string,
    data: Parameters<typeof externalRefsApi.update>[1]
  ) => {
    await externalRefsApi.update(id, data)
    await load()
  }

  const setProcessingType = async (type: ExternalRefProcessingType) => {
    if (!selected) return
    if (type === 'partial') {
      setPartialMode(true)
      setSelectedParagraphs([])
      return
    }
    setPartialMode(false)
    try {
      await updateRef(selected.id, { processingType: type, tags: fileTags })
      success(type === 'complete' ? '已标记为完整引用' : '已标记为未处理')
      const updated = (await externalRefsApi.getAll()).find(r => r.id === selected.id)
      if (updated) selectRef(updated)
    } catch {
      notifyError('更新失败')
    }
  }

  const confirmPartial = async () => {
    if (!selected || selectedParagraphs.length === 0) {
      notifyError('请至少选择一个段落')
      return
    }
    const paragraphs = getParagraphs(selected)
    const annotations: ExternalRefAnnotation[] = selectedParagraphs.map(idx => ({
      paragraphIndex: idx,
      content: paragraphs[idx] || '',
      note: annotationNote.trim() || undefined,
      tags: annotationTags.length ? annotationTags : undefined,
    }))
    try {
      await updateRef(selected.id, {
        processingType: 'partial',
        annotations,
        tags: fileTags,
        comment: annotationNote.trim() || selected.comment || undefined,
      })
      success('已标记为部分引用')
      setPartialMode(false)
      const updated = (await externalRefsApi.getAll()).find(r => r.id === selected.id)
      if (updated) selectRef(updated)
    } catch {
      notifyError('保存失败')
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm(`确定删除「${selected.fileName}」？`)) return
    try {
      await externalRefsApi.delete(selected.id)
      success('已删除')
      selectRef(null)
      await load()
    } catch {
      notifyError('删除失败')
    }
  }

  const handleCreateOrigin = async (ref: FileReference) => {
    setCreatingOrigin(true)
    try {
      const created = await createOriginFromExternalRef(ref)
      success('已提炼创意缘起')
      navigate(`/creative/proposals/${created.id}`)
    } catch {
      notifyError('创建失败')
    } finally {
      setCreatingOrigin(false)
    }
  }

  const removeFromCited = async (id: string) => {
    try {
      await updateRef(id, { processingType: 'none', annotations: [] })
      success('已移回未处理列表')
      if (selectedId === id) selectRef(null)
    } catch {
      notifyError('操作失败')
    }
  }

  const paragraphs = selected ? getParagraphs(selected) : []

  const leftPanel = (
    <>
      <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">文件列表</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-xs text-gray-400 p-2">加载中…</p>
        ) : listRefs.length === 0 ? (
          <p className="text-xs text-gray-400 p-2">暂无未处理文件，请导入 .md</p>
        ) : (
          listRefs.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRef(r)}
              className={`w-full text-left px-2 py-2 rounded-lg text-sm ${
                selectedId === r.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium truncate">{r.metadata?.title || r.fileName}</div>
              <TypeLabel type="none" compact />
            </button>
          ))
        )}
      </div>
    </>
  )

  const middlePanel = (
    <>
      <div
        className={`border-b p-4 transition-colors ${dragOver ? 'bg-indigo-50' : 'bg-gray-50'}`}
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="text-sm text-gray-600 mb-2">拖拽 .md 文件到此处，或</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {importing ? '导入中…' : '选择文件'}
        </button>
      </div>

      {selected ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-medium text-sm truncate">
              {selected.metadata?.title || selected.fileName}
            </h3>
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                disabled={creatingOrigin}
                onClick={() => void handleCreateOrigin(selected)}
                className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                {creatingOrigin ? '提炼中…' : '由此提炼创意缘起'}
              </button>
              <button
                type="button"
                onClick={() => void setProcessingType('complete')}
                className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                完整引用
              </button>
              <button
                type="button"
                onClick={() => void setProcessingType('partial')}
                className="text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                部分引用
              </button>
              <button
                type="button"
                onClick={() => void setProcessingType('none')}
                className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                取消标记
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                删除
              </button>
            </div>
          </div>

          {!partialMode && (
            <p className="text-xs text-gray-500 px-4 py-1">
              完整引用会整篇作为创意来源；部分引用可选择段落并添加批注。
            </p>
          )}

          {partialMode ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm text-gray-600">勾选要引用的段落，并填写批注与标签：</p>
              {paragraphs.map((p, idx) => (
                <label
                  key={idx}
                  className="flex gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedParagraphs.includes(idx)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedParagraphs([...selectedParagraphs, idx])
                      } else {
                        setSelectedParagraphs(selectedParagraphs.filter(i => i !== idx))
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-6">{p}</div>
                </label>
              ))}
              <div>
                <label className="text-xs text-gray-500">批注</label>
                <textarea
                  value={annotationNote}
                  onChange={e => setAnnotationNote(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <TagInput tags={annotationTags} onChange={setAnnotationTags} suggestions={allTags} />
              <button
                type="button"
                onClick={() => void confirmPartial()}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg"
              >
                确认标记
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose prose-sm max-w-none mb-4">
                <ReactMarkdown>{selected.fileContent || ''}</ReactMarkdown>
              </div>
              <div className="border-t pt-3">
                <label className="text-xs text-gray-500">文件标签</label>
                <TagInput tags={fileTags} onChange={setFileTags} suggestions={allTags} />
                <button
                  type="button"
                  onClick={() => void updateRef(selected.id, { tags: fileTags })}
                  className="mt-2 text-xs text-indigo-600 hover:underline"
                >
                  保存标签修改
                  </button>
                  <p className="text-xs text-gray-400 mt-1">标签修改需点击保存。</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8">
          导入或选择左侧文件以预览
        </div>
      )}
    </>
  )

  const rightPanel = (
    <div className="flex flex-col h-full text-sm">
      <div className="px-3 py-2 border-b bg-gray-50 font-medium">可引用区</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <section>
          <h4 className="text-xs font-semibold text-blue-700 mb-2">完整引用</h4>
          {type1Refs.length === 0 ? (
            <p className="text-xs text-gray-400">暂无</p>
          ) : (
            type1Refs.map(r => (
              <div key={r.id} className="mb-2 p-2 border border-blue-100 rounded-lg bg-blue-50/40">
                <div className="font-medium">{r.metadata?.title || r.fileName}</div>
                <p className="text-xs text-blue-600 mt-1">已标记为创意来源</p>
                <button
                  type="button"
                  onClick={() => void removeFromCited(r.id)}
                  className="text-xs text-gray-500 mt-1 hover:underline"
                >
                  移回列表
                </button>
              </div>
            ))
          )}
        </section>
        <section>
          <h4 className="text-xs font-semibold text-emerald-700 mb-2">部分引用</h4>
          {type2Refs.length === 0 ? (
            <p className="text-xs text-gray-400">暂无</p>
          ) : (
            type2Refs.map(r => (
              <div key={r.id} className="mb-2 p-2 border border-emerald-100 rounded-lg">
                <div className="font-medium">{r.metadata?.title || r.fileName}</div>
                {(r.annotations || []).map((a, i) => (
                  <div key={i} className="mt-2 pl-2 border-l-2 border-emerald-300 text-xs">
                    <div className="text-gray-700 line-clamp-3 whitespace-pre-wrap">{a.content}</div>
                    {a.note && <p className="text-gray-500 mt-1">批注：{a.note}</p>}
                    {a.tags?.length ? (
                      <p className="text-gray-400 mt-0.5">{a.tags.map(t => `#${t}`).join(' ')}</p>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => void removeFromCited(r.id)}
                  className="text-xs text-gray-500 mt-2 hover:underline"
                >
                  移回列表
                </button>
              </div>
            ))
          )}
        </section>
        <p className="text-xs text-gray-400 leading-relaxed mt-2 pt-2 border-t border-gray-100">
          已处理的外来参考会出现在创意作品的引用选择中。返回创意组后，可在作品构思中引用这些材料。
        </p>
      </div>
    </div>
  )

  return (
    <ThreeColumnLayout
      header={
        <div className="flex items-center gap-3 px-3">
          <Link to="/creative/chat" className="text-sm text-gray-500 hover:text-gray-900">
            返回创意组
          </Link>
          <TagFilterBar allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
        </div>
      }
      left={leftPanel}
      middle={middlePanel}
      right={rightPanel}
    />
  )
}
