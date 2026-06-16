import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, proposalsApi, type Project, type Proposal } from '../../services/api'
import { confirmPlanningWithReadiness } from '../../services/planningConfirm'
import { hasReleasedToStudio } from '../../services/releaseHandoff'
import { useUIStore } from '../../stores/uiStore'
import ProjectPickerView, { type PlanningAction } from '../../components/projects/ProjectPickerView'
import { IconPlanning } from '../../components/ui/icons'

// ---- 企划课 consolidated page ----

export default function PlanningPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])

  const load = useCallback(async () => {
    try {
      setProjects(await projectsApi.getAll())
    } catch { /* silent */ }
    try {
      setProposals(await proposalsApi.getAll())
    } catch { /* silent */ }
  }, [])

  useEffect(() => { void load() }, [load])

  const planningProposals = useMemo(
    () => proposals.filter(p => ['submitted', 'evaluated'].includes(p.status)),
    [proposals]
  )

  const planning = useMemo(() => projects.filter(p => p.status === 'planning'), [projects])
  const planned = useMemo(
    () => projects.filter(p => p.status === 'planned' && !hasReleasedToStudio(p)),
    [projects],
  )

  const handleAction = useCallback(async (id: string, action: PlanningAction) => {
    try {
      switch (action) {
        case 'confirm-planning': {
          const project = projects.find(p => p.id === id)
          if (!project) throw new Error('作品不存在')
          await confirmPlanningWithReadiness(project)
          addNotification({ type: 'success', title: '企划已完成' })
          break
        }
        case 'back-to-planning':
          await projectsApi.transition(id, 'planning')
          addNotification({ type: 'success', title: '已退回企划中' })
          break
        case 'soft-delete':
          await projectsApi.softDelete(id)
          addNotification({ type: 'success', title: '已放入文件暂存' })
          break
        case 'release-to-studio':
          await projectsApi.releaseToStudio(id)
          addNotification({ type: 'success', title: '已提交创作室' })
          break
      }
      await load()
    } catch (e: unknown) { addNotification({ type: 'error', title: '操作失败', message: (e as Error).message }) }
  }, [load, addNotification, projects])

  const total = planningProposals.length + planning.length + planned.length

  const EMPTY_CLASS =
    'text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200'

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 animate-fade-in overflow-x-hidden">
      {/* 说明区 */}
      <div className="flex items-start gap-4 min-w-0">
        <div className="bg-blue-100 p-2 rounded-lg mt-1 shrink-0"><IconPlanning size={22} className="text-blue-600" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">企划课</h1>
          <p className="text-sm text-gray-500 mt-1">承接待企划作品，完善作品设定与作品章节，确认后提交创作室。</p>
          <p className="text-xs text-gray-400 mt-1">{total} 部作品（待企划 / 企划进行中 / 已完成企划）</p>
        </div>
      </div>

      {/* 三列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* 待企划 — 待企划作品 */}
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">待企划 {planningProposals.length} 部</h2>
          {planningProposals.length === 0 ? (
            <p className={EMPTY_CLASS}>
              暂无待企划作品
            </p>
          ) : (
            <div className="space-y-3">
              {planningProposals.map(p => (
                <div key={p.id} className="bg-white border rounded-xl p-4 hover:border-blue-200 transition-all min-w-0">
                  <button onClick={() => navigate(`/planning/proposals/${p.id}`)} className="text-left w-full">
                    <h3 className="font-medium text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{p.synopsis?.slice(0, 80) || '—'}</p>
                  </button>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => navigate(`/planning/proposals/${p.id}`)}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">查看并接收</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 企划进行中 */}
        <ProjectPickerView
          title={`企划进行中 ${planning.length} 部`}
          subtitle={`${planning.length} 部企划进行中作品`}
          projects={planning}
          loading={false}
          emptyText="暂无企划进行中作品。接收入企划课后将出现在此。"
          phase="planning"
          onOpen={id => navigate(`/work/${id}?from=planning`)}
          onAction={handleAction}
          compact
        />

        {/* 已完成企划 */}
        <ProjectPickerView
          title={`已完成企划 ${planned.length} 部`}
          subtitle={`${planned.length} 部已完成企划作品`}
          projects={planned}
          loading={false}
          emptyText="暂无已完成企划作品。确认企划完成后将出现在此。"
          phase="planning"
          onOpen={id => navigate(`/work/${id}?from=planning`)}
          onAction={handleAction}
          compact
        />
      </div>
    </div>
  )
}
