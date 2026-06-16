import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getProposalMetadata,
  proposalsApi,
  scrapsApi,
  externalRefsApi,
  type Proposal,
  type Scrap,
  type FileReference,
} from '../../services/api'
import { createConceivingProposal, creativeStageLabel, getCreativeStage } from '../../services/creativeOrigin'
import { useNotifications } from '../../hooks/useNotifications'
import { IconCreative } from '../ui/icons'

export default function CreativeWorkspace() {
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifications()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [refs, setRefs] = useState<FileReference[]>([])
  const [loading, setLoading] = useState(true)
  const [refCount, setRefCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([proposalsApi.getAll(), scrapsApi.getAll()])
      setProposals(p)
      setScraps(s)
    } catch { notifyError('加载失败') }
    try {
      const r = await externalRefsApi.getAll()
      setRefs(r.slice(0, 5))
      setRefCount(r.length)
    } catch { setRefs([]); setRefCount(0) }
    finally { setLoading(false) }
  }, [notifyError])

  useEffect(() => { void load() }, [load])

  const pending = useMemo(() => proposals.filter(p => p.status === 'draft'), [proposals])
  const formed = useMemo(() => proposals.filter(p => p.status === 'submitted' || p.status === 'evaluated'), [proposals])

  const handleNew = async () => {
    const name = window.prompt('作品标题', '新创意作品')
    if (!name?.trim()) return
    try {
      const created = await createConceivingProposal(name.trim())
      await load()
      success('已创建')
      navigate(`/creative/proposals/${created.id}`)
    } catch { notifyError('创建失败') }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400">加载中…</div>
  }

  const scrapCount = scraps.length

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 animate-fade-in overflow-x-hidden">
      <div className="flex items-start gap-4 min-w-0">
        <div className="bg-amber-100 p-2 rounded-lg mt-1 shrink-0"><IconCreative size={22} className="text-amber-600" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">创意组</h1>
          <p className="text-sm text-gray-500 mt-1">从作品构思开始，沉淀标题、梗概和初步创意材料，形成创意作品。</p>
          <p className="text-xs text-gray-400 mt-1">{scrapCount + refCount} 条素材 · {pending.length} 部构思中 · {formed.length} 部创意作品</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* 左列：创意来源 */}
        <section className="space-y-4 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">创意来源</h2>

          <div className="bg-white border rounded-xl p-4">
            <Link to="/creative/scraps" className="text-sm font-semibold text-gray-900 hover:text-amber-700">
              灵感碎片 {scrapCount} 条
            </Link>
            {scraps.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">暂无碎片</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {scraps.slice(0, 5).map(s => (
                  <li key={s.id} className="text-xs text-gray-600 truncate">{s.content?.slice(0, 60) || '未命名'}</li>
                ))}
                {scraps.length > 5 && <li className="text-xs text-gray-400">…还有 {scraps.length - 5} 条</li>}
              </ul>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <Link to="/creative/external-refs" className="text-sm font-semibold text-gray-900 hover:text-amber-700">
              外来参考 {refCount} 条
            </Link>
            {refs.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">暂无引用</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {refs.map(r => (
                  <li key={r.id} className="text-xs text-gray-600 truncate">{r.fileName}</li>
                ))}
                {refCount > 5 && <li className="text-xs text-gray-400">…还有 {refCount - 5} 条</li>}
              </ul>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4 opacity-60">
            <span className="text-sm font-semibold text-gray-400">AI 搜索</span>
            <p className="text-xs text-gray-400 mt-2">功能正在开发中</p>
          </div>
        </section>

        {/* 中列：作品构思中 */}
        <section className="space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">作品构思中 {pending.length} 部</h2>
            <button
              onClick={() => void handleNew()}
              className="text-xs px-2 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              新作品创意构思
            </button>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              暂无构思中作品。点击「新作品创意构思」开始。
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map(p => {
                const meta = getProposalMetadata(p)
                const stage = getCreativeStage(meta)
                const stageLabel = creativeStageLabel(stage, p.status)
                return (
                <button key={p.id} onClick={() => navigate(`/creative/proposals/${p.id}`)}
                  className="w-full text-left bg-white border rounded-xl p-4 hover:border-amber-200 transition-all min-w-0"
                >
                  <h3 className="font-medium text-sm truncate">{p.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">{stageLabel}</div>
                </button>
              )})}
            </div>
          )}
        </section>

        {/* 右列：创意作品 */}
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">创意作品 {formed.length} 部</h2>
          {formed.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              暂无创意作品。构思完成后提交将显示在此。
            </p>
          ) : (
            <div className="space-y-2">
              {formed.map(p => (
                <div key={p.id} className="bg-white border border-green-200 rounded-xl p-4 min-w-0">
                  <h3 className="font-medium text-sm truncate">{p.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.status === 'submitted' ? '已提交至企划课' : '已评估'}
                  </div>
                  <Link to={`/creative/proposals/${p.id}`}
                    className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看详情</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
