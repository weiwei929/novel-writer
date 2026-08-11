import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, chaptersApi, type Project } from '../../services/api'
import { hasReleasedToEditorial, hasReleasedToStudio } from '../../services/releaseHandoff'
import { useUIStore } from '../../stores/uiStore'
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge'
import { IconWriting } from '../../components/ui/icons'
import HandoffConfirmModal from '../../components/ui/HandoffConfirmModal'

type StudioAction = 'start-writing' | 'mark-written' | 'undo-written' | 'soft-delete' | 'submit-to-editorial'

const ACTIONS: Record<StudioAction, string> = {
  'start-writing': '开始创作', 'mark-written': '作品已完成', 'undo-written': '退回写作',
  'soft-delete': '放入文件暂存', 'submit-to-editorial': '提交至编审部',
}

function getActions(status: string): StudioAction[] {
  switch (status) {
    case 'planned': return ['start-writing']
    case 'writing': return ['mark-written']
    case 'written': return ['submit-to-editorial', 'undo-written', 'soft-delete']
    default: return []
  }
}

function WorkCard({ p, onOpen, onAction }: { p: Project; onOpen: (id: string) => void; onAction: (id: string, a: StudioAction) => void }) {
  const actions = getActions(p.status)
  return (
    <div className="bg-white border rounded-xl p-4 hover:border-blue-200 transition-all min-w-0">
      <button type="button" onClick={() => onOpen(p.id)} className="text-left w-full min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate min-w-0 flex-1">{p.title}</h3>
          <ProjectStatusBadge status={p.status} phase="studio" />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {p.wordCount.toLocaleString()} 字{p.chapterCount != null ? ` · ${p.chapterCount} 章` : ''}
        </div>
      </button>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
          {actions.map(a => (
            <button key={a} type="button" onClick={e => { e.stopPropagation(); onAction(p.id, a) }}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                a === 'start-writing' || a === 'mark-written' ? 'bg-blue-600 text-white hover:bg-blue-700'
                : a === 'soft-delete' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                : a === 'submit-to-editorial' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{ACTIONS[a]}</button>
          ))}
        </div>
      )}
    </div>
  )
}

const EMPTY_CLASS =
  'text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200'

export default function WritingProjectsPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [submittingProject, setSubmittingProject] = useState<Project | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    try { setProjects(await projectsApi.getAll()) } catch { /* */ }
  }, [])
  useEffect(() => { void load() }, [load])

  const planned = useMemo(
    () => projects.filter(p => p.status === 'planned' && hasReleasedToStudio(p)),
    [projects],
  )
  const writing = useMemo(() => projects.filter(p => p.status === 'writing'), [projects])
  const writtenActive = useMemo(
    () => projects.filter(p => p.status === 'written' && !hasReleasedToEditorial(p)),
    [projects],
  )
  const writtenReleased = useMemo(
    () => projects.filter(p => hasReleasedToEditorial(p)),
    [projects],
  )

  const handleAction = useCallback(async (id: string, a: StudioAction) => {
    try {
      if (a === 'submit-to-editorial') {
        const p = projects.find(item => item.id === id)
        if (p) setSubmittingProject(p)
        return
      }
      if (a === 'start-writing') {
        await projectsApi.startWriting(id)
        const chapterList = await chaptersApi.getByProjectId(id)
        const sorted = [...chapterList].sort((x, y) => x.order - y.order)
        addNotification({ type: 'success', title: '已开始创作' })
        await load()
        if (sorted.length > 0) {
          navigate(`/writing/${id}/${sorted[0].id}?from=writing`)
        }
        return
      }
      if (a === 'mark-written') await projectsApi.markWritten(id)
      else if (a === 'undo-written') await projectsApi.undoWritten(id)
      else if (a === 'soft-delete') await projectsApi.softDelete(id)
      addNotification({ type: 'success', title: { 'start-writing': '已开始创作', 'mark-written': '作品已完成', 'undo-written': '已退回', 'soft-delete': '已放入文件暂存', 'submit-to-editorial': '已提交至编审部' }[a] })
      await load()
    } catch (e: unknown) { addNotification({ type: 'error', title: '操作失败', message: (e as Error).message }) }
  }, [load, addNotification, navigate, projects])

  const handleConfirmSubmitToEditorial = useCallback(async () => {
    if (!submittingProject) return
    setActionLoading(true)
    try {
      await projectsApi.releaseToEditorial(submittingProject.id)
      addNotification({ type: 'success', title: '已提交至编审部' })
      setSubmittingProject(null)
      await load()
    } catch (e: unknown) {
      addNotification({ type: 'error', title: '提交失败', message: (e as Error).message })
    } finally {
      setActionLoading(false)
    }
  }, [submittingProject, load, addNotification])

  const total = planned.length + writing.length + writtenActive.length

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 animate-fade-in overflow-x-hidden">
      <div className="flex items-start gap-4 min-w-0">
        <div className="bg-blue-100 p-2 rounded-lg mt-1 shrink-0"><IconWriting size={22} className="text-blue-600" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">创作室</h1>
          <p className="text-sm text-gray-500 mt-1">承接已完成企划，将作品章节写成正文，完成后提交编审部。</p>
          <p className="text-xs text-gray-400 mt-1">{total} 部作品（待创作 / 创作中 / 已完成创作）</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">待创作 {planned.length} 部</h2>
          {planned.length === 0 ? <p className={EMPTY_CLASS}>暂无待创作作品</p>
          : planned.map(p => <WorkCard key={p.id} p={p} onOpen={id => navigate(`/work/${id}?from=writing`)} onAction={handleAction} />)}
        </section>
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">创作中 {writing.length} 部</h2>
          {writing.length === 0 ? <p className={EMPTY_CLASS}>暂无创作中作品</p>
          : writing.map(p => <WorkCard key={p.id} p={p} onOpen={id => navigate(`/work/${id}?from=writing`)} onAction={handleAction} />)}
        </section>
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            已完成创作 {writtenActive.length} 部
            {writtenReleased.length > 0 && (
              <span className="text-xs font-normal text-gray-400 ml-1.5">· 已提交 {writtenReleased.length} 部</span>
            )}
          </h2>
          {writtenActive.length === 0 && writtenReleased.length === 0 ? <p className={EMPTY_CLASS}>暂无已完成作品</p>
          : (
            <div className="space-y-3">
              {writtenActive.map(p => (
                <WorkCard key={p.id} p={p} onOpen={id => navigate(`/work/${id}?from=writing`)} onAction={handleAction} />
              ))}
              {writtenReleased.map(p => (
                <div key={p.id} className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 min-w-0 text-gray-400">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-400 truncate flex-1">{p.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 shrink-0 font-medium">已提交编审部</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                    <span>{p.wordCount.toLocaleString()} 字</span>
                    <span>已提交 · {new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <HandoffConfirmModal
        open={Boolean(submittingProject)}
        targetDepartmentName="编审部"
        workTitle={submittingProject?.title || ''}
        confirmText="确认提交"
        loading={actionLoading}
        onConfirm={() => void handleConfirmSubmitToEditorial()}
        onCancel={() => setSubmittingProject(null)}
      />
    </div>
  )
}
