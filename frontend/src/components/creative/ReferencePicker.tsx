import { useCallback, useEffect, useState } from 'react'
import { IconClose } from '../ui/icons'
import {
  externalRefsApi,
  scrapsApi,
  type FileReference,
  type ProposalReference,
  type Scrap,
} from '../../services/api'
import {
  displayScrapTags,
  getScrapProcessingType,
  parseScrapContent,
} from './scrapUtils'
import TypeLabel from './TypeLabel'

export interface ReferencePickerProps {
  open: boolean
  selected: ProposalReference[]
  onConfirm: (refs: ProposalReference[]) => void
  onCancel: () => void
}

type PickerTab = 'scrap' | 'file_ref'

export default function ReferencePicker({
  open,
  selected,
  onConfirm,
  onCancel,
}: ReferencePickerProps) {
  const [tab, setTab] = useState<PickerTab>('scrap')
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [files, setFiles] = useState<FileReference[]>([])
  const [picked, setPicked] = useState<ProposalReference[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([scrapsApi.getAll(), externalRefsApi.getAll()])
      setScraps(s)
      setFiles(
        f.filter(
          r => r.processingType === 'complete' || r.processingType === 'partial'
        )
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setPicked(selected)
    void load()
  }, [open, load])

  if (!open) return null

  const toggle = (ref: ProposalReference) => {
    const exists = picked.some(p => p.type === ref.type && p.id === ref.id)
    if (exists) {
      setPicked(picked.filter(p => !(p.type === ref.type && p.id === ref.id)))
    } else {
      setPicked([...picked, ref])
    }
  }

  const isChecked = (type: string, id: string) =>
    picked.some(p => p.type === type && p.id === id)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">引用素材</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <IconClose size={18} />
          </button>
        </div>

        <div className="flex border-b px-5 gap-4">
          <button
            type="button"
            onClick={() => setTab('scrap')}
            className={`py-2 text-sm border-b-2 -mb-px ${
              tab === 'scrap' ? 'border-amber-500 text-amber-800' : 'border-transparent'
            }`}
          >
            灵感碎片
          </button>
          <button
            type="button"
            onClick={() => setTab('file_ref')}
            className={`py-2 text-sm border-b-2 -mb-px ${
              tab === 'file_ref' ? 'border-amber-500 text-amber-800' : 'border-transparent'
            }`}
          >
            外来参考
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-400">加载中…</p>
          ) : tab === 'scrap' ? (
            scraps.length === 0 ? (
              <p className="text-sm text-gray-400">暂无灵感</p>
            ) : (
              scraps.map(s => {
                const { title } = parseScrapContent(s.content)
                const pt = getScrapProcessingType(s.tags)
                const ref: ProposalReference = {
                  type: 'scrap',
                  id: s.id,
                  title,
                  processingType: pt === 'none' ? undefined : pt,
                }
                return (
                  <label
                    key={s.id}
                    className="flex items-start gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked('scrap', s.id)}
                      onChange={() => toggle(ref)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{title}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">灵感</span>
                        {pt !== 'none' && <TypeLabel type={pt} compact />}
                        {displayScrapTags(s.tags).slice(0, 2).map(t => (
                          <span key={t} className="text-xs text-gray-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                )
              })
            )
          ) : files.length === 0 ? (
            <p className="text-sm text-gray-400">暂无已标记的外来参考</p>
          ) : (
            files.map(f => {
              const ref: ProposalReference = {
                type: 'file_ref',
                id: f.id,
                title: f.metadata?.title || f.fileName,
                processingType: f.processingType,
              }
              return (
                <label
                  key={f.id}
                  className="flex items-start gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked('file_ref', f.id)}
                    onChange={() => toggle(ref)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {f.metadata?.title || f.fileName}
                    </div>
                    <TypeLabel type={f.processingType} compact />
                  </div>
                </label>
              )
            })
          )}
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(picked)}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            确认引用 ({picked.length})
          </button>
        </div>
      </div>
    </div>
  )
}
