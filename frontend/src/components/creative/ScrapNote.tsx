import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { scrapsApi, type Scrap } from '../../services/api'
import { createOriginFromScrap } from '../../services/creativeOrigin'
import { useNotifications } from '../../hooks/useNotifications'
import ThreeColumnLayout from './ThreeColumnLayout'
import TagInput, { TagFilterBar } from './TagInput'
import TypeLabel from './TypeLabel'
import {
  collectAllTags,
  displayScrapTags,
  formatScrapContent,
  getScrapProcessingType,
  parseScrapContent,
  scrapPreview,
  setScrapProcessingType,
  type ScrapProcessingType,
} from './scrapUtils'

export default function ScrapNote() {
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()
  const notifyErrorRef = useRef(notifyError)
  notifyErrorRef.current = notifyError
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [processingType, setProcessingType] = useState<ScrapProcessingType>('none')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [creatingOrigin, setCreatingOrigin] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await scrapsApi.getAll()
      setScraps(data)
    } catch {
      notifyErrorRef.current('加载失败', '无法获取灵感碎片')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const allTags = useMemo(() => collectAllTags(scraps), [scraps])

  const filtered = useMemo(() => {
    return scraps.filter(s => {
      if (!activeTag) return true
      return displayScrapTags(s.tags).includes(activeTag)
    })
  }, [scraps, activeTag])

  const cited = useMemo(
    () => scraps.filter(s => {
      const pt = getScrapProcessingType(s.tags)
      return pt === 'complete' || pt === 'partial'
    }),
    [scraps]
  )

  const selectScrap = (scrap: Scrap | null) => {
    if (dirty && !window.confirm('当前灵感碎片有未保存修改，离开后将丢失。是否继续？')) {
      return
    }
    setDirty(false)
    if (!scrap) {
      setSelectedId(null)
      setTitle('')
      setBody('')
      setNote('')
      setTags([])
      setProcessingType('none')
      return
    }
    setSelectedId(scrap.id)
    const parsed = parseScrapContent(scrap.content)
    setTitle(parsed.title)
    setBody(parsed.body)
    setNote(scrap.note || '')
    setTags(displayScrapTags(scrap.tags))
    setProcessingType(getScrapProcessingType(scrap.tags))
  }

  const handleNew = () => selectScrap(null)

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) {
      notifyError('请先填写灵感碎片内容')
      return
    }
    setSaving(true)
    try {
      const content = formatScrapContent(title || '未命名灵感', body)
      const tagsWithPt = setScrapProcessingType(tags, processingType)
      if (selectedId) {
        await scrapsApi.update(selectedId, { content, note: note.trim() || undefined, tags: tagsWithPt })
      } else {
        const created = await scrapsApi.create({ content, note: note.trim() || undefined, tags: tagsWithPt })
        setSelectedId(created.id)
      }
      success('已保存')
      await load()
      setDirty(false)
    } catch { notifyError('保存失败') }
    finally { setSaving(false) }
  }

  const handleCreateOrigin = async () => {
    if (!selectedId) return
    const scrap = scraps.find(s => s.id === selectedId)
    if (!scrap) return
    if (dirty && !window.confirm('当前灵感碎片有未保存修改，继续创建创意缘起将使用已保存版本。是否继续？')) {
      return
    }
    setCreatingOrigin(true)
    try {
      const created = await createOriginFromScrap(scrap)
      success('已创建创意缘起')
      navigate(`/creative/proposals/${created.id}`)
    } catch {
      notifyError('创建失败')
    } finally {
      setCreatingOrigin(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    if (!window.confirm('确定删除这条灵感？')) return
    try {
      await scrapsApi.delete(selectedId)
      success('已删除')
      selectScrap(null)
      await load()
    } catch { notifyError('删除失败') }
  }

  const leftPanel = (
    <>
      <div className="px-3 py-2 border-b flex items-center justify-between bg-gray-50">
        <span className="text-sm font-medium text-gray-800">灵感列表</span>
        <button type="button" onClick={handleNew}
          className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700">+ 新建</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-xs text-gray-400 p-2">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-400 p-2">暂无灵感，点击新建开始记录</p>
        ) : (
          filtered.map(s => {
            const { title: t } = parseScrapContent(s.content)
            const pt = getScrapProcessingType(s.tags)
            return (
              <button key={s.id} type="button" onClick={() => selectScrap(s)}
                className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors ${
                  selectedId === s.id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 truncate">{t}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{scrapPreview(s)}</div>
                <div className="mt-1"><TypeLabel type={pt} compact /></div>
              </button>
            )
          })
        )}
      </div>
    </>
  )

  const middlePanel = (
    <>
      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium text-gray-800">写作区</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">标题</label>
          <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true) }}
            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="灵感标题…" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">内容</label>
          <textarea value={body} onChange={e => { setBody(e.target.value); setDirty(true) }}
            rows={10} className="w-full px-3 py-2 border rounded-lg text-sm resize-y min-h-[160px]"
            placeholder="记录人物、情节、对话灵感…" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">备注（可选）</label>
          <input value={note} onChange={e => { setNote(e.target.value); setDirty(true) }}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">标签</label>
          <TagInput tags={tags} onChange={t => { setTags(t); setDirty(true) }} suggestions={allTags} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">引用类型</label>
          <div className="flex flex-wrap gap-2">
            {(['none', 'partial', 'complete'] as ScrapProcessingType[]).map(t => (
              <button key={t} type="button" onClick={() => { setProcessingType(t); setDirty(true) }}
                className={`rounded-lg border px-2 py-1 ${processingType === t ? 'ring-2 ring-amber-400' : ''}`}>
                <TypeLabel type={t} compact />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            完整引用会整体作为创意来源；部分引用用于标记片段或局部想法；未处理表示暂不进入可引用区。
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <p className="text-xs text-gray-400">修改标题、内容、备注、标签和引用类型后，需点击保存。</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void handleSave()} disabled={saving}
              className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? '保存中…' : '保存灵感碎片'}
            </button>
            {selectedId && (
              <button type="button" onClick={() => void handleCreateOrigin()} disabled={creatingOrigin}
                className="px-4 py-2 border border-amber-300 text-amber-800 text-sm rounded-lg hover:bg-amber-50 disabled:opacity-50">
                {creatingOrigin ? '创建中…' : '由此创建创意缘起'}
              </button>
            )}
            {selectedId && (
              <button type="button" onClick={() => void handleDelete()}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50">删除</button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  const rightPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">可引用区</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
        <section>
          <h4 className="text-xs font-semibold text-blue-700 mb-2">完整引用</h4>
          {cited.filter(s => getScrapProcessingType(s.tags) === 'complete').length === 0 ? (
            <p className="text-xs text-gray-400">暂无</p>
          ) : (
            cited.filter(s => getScrapProcessingType(s.tags) === 'complete').map(s => {
              const { title: t } = parseScrapContent(s.content)
              return (
                <button key={s.id} type="button" onClick={() => selectScrap(s)}
                  className="block w-full text-left mb-2 p-2 rounded border border-blue-100 bg-blue-50/50 hover:bg-blue-50">
                  <div className="font-medium text-gray-900">{t}</div>
                  <div className="text-xs text-gray-500 mt-1">已标记为创意来源</div>
                </button>
              )
            })
          )}
        </section>
        <section>
          <h4 className="text-xs font-semibold text-emerald-700 mb-2">部分引用</h4>
          {cited.filter(s => getScrapProcessingType(s.tags) === 'partial').length === 0 ? (
            <p className="text-xs text-gray-400">暂无</p>
          ) : (
            cited.filter(s => getScrapProcessingType(s.tags) === 'partial').map(s => {
              const { title: t } = parseScrapContent(s.content)
              return (
                <button key={s.id} type="button" onClick={() => selectScrap(s)}
                  className="block w-full text-left mb-2 p-2 rounded border border-emerald-100 bg-emerald-50/50">
                  <div className="font-medium">{t}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scrapPreview(s, 80)}</p>
                </button>
              )
            })
          )}
        </section>
        <p className="text-xs text-gray-400 leading-relaxed mt-2 pt-2 border-t border-gray-100">
          已标记的灵感碎片会出现在创意作品的引用选择中。返回创意组后，可在作品构思中引用这些材料。
        </p>
      </div>
    </div>
  )

  return (
    <ThreeColumnLayout
      header={
        <div className="flex items-center gap-3 px-3">
          <Link to="/creative/workspace" className="text-sm text-gray-500 hover:text-gray-900">返回创意组</Link>
          <TagFilterBar allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
        </div>
      }
      left={leftPanel}
      middle={middlePanel}
      right={rightPanel}
    />
  )
}
