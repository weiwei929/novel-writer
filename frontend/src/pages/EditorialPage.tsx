import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../services/api'
import { useUIStore } from '../stores/uiStore'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import { IconReview } from '../components/ui/icons'

type EditorialAction = 'start-review' | 'confirm-review' | 'back-to-reviewing' | 'soft-delete' | 'submit-to-library'

const ACTIONS: Record<EditorialAction, string> = {
  'start-review': '开始审阅',
  'confirm-review': '确认审阅完成',
  'back-to-reviewing': '退回审阅中',
  'soft-delete': '放入文件暂存',
  'submit-to-library': '提交文集库',
}

function getActions(status: string): EditorialAction[] {
  switch (status) {
    case 'written':
      return ['start-review', 'soft-delete']
    case 'reviewing':
      return ['confirm-review', 'soft-delete']
    case 'reviewed':
      return ['submit-to-library', 'back-to-reviewing', 'soft-delete']
    default:
      return []
  }
}

function actionButtonClass(action: EditorialAction): string {
  if (action === 'start-review' || action === 'confirm-review') {
    return 'bg-blue-600 text-white hover:bg-blue-700'
  }
  if (action === 'soft-delete') {
    return 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
  }
  if (action === 'submit-to-library') {
    return 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
  }
  return 'border border-gray-200 text-gray-600 hover:bg-gray-50'
}

/** 与创作室 WritingProjectsPage WorkCard 同结构、同密度 */
function WorkCard({
  p,
  onOpen,
  onAction,
}: {
  p: Project
  onOpen: (id: string) => void
  onAction: (id: string, a: EditorialAction) => void
}) {
  const actions = getActions(p.status)
  return (
    <div className="bg-white border rounded-xl p-4 hover:border-amber-200 transition-all">
      <button type="button" onClick={() => onOpen(p.id)} className="text-left w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{p.title}</h3>
          <ProjectStatusBadge status={p.status} phase="editorial" />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {p.wordCount.toLocaleString()} 字{p.chapterCount != null ? ` · ${p.chapterCount} 章` : ''}
        </div>
      </button>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
          {actions.map(a => (
            <button
              key={a}
              type="button"
              onClick={e => {
                e.stopPropagation()
                onAction(p.id, a)
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${actionButtonClass(a)}`}
            >
              {ACTIONS[a]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const EMPTY_CLASS =
  'text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200'

export default function EditorialPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])

  const load = useCallback(async () => {
    try {
      setProjects(await projectsApi.getAll())
    } catch {
      /* */
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const pending = useMemo(() => projects.filter(p => p.status === 'written'), [projects])
  const active = useMemo(() => projects.filter(p => p.status === 'reviewing'), [projects])
  const completed = useMemo(() => projects.filter(p => p.status === 'reviewed'), [projects])

  const handleAction = useCallback(
    async (id: string, a: EditorialAction) => {
      try {
        if (a === 'start-review') await projectsApi.submitReview(id)
        else if (a === 'confirm-review') await projectsApi.transition(id, 'reviewed')
        else if (a === 'back-to-reviewing') await projectsApi.transition(id, 'reviewing')
        else if (a === 'soft-delete') await projectsApi.softDelete(id)
        addNotification({
          type: 'success',
          title: {
            'start-review': '已开始审阅',
            'confirm-review': '审阅已完成',
            'back-to-reviewing': '已退回',
            'soft-delete': '已放入文件暂存',
            'submit-to-library': '已提交文集库',
          }[a],
        })
        await load()
      } catch (e: unknown) {
        addNotification({ type: 'error', title: '操作失败', message: (e as Error).message })
      }
    },
    [load, addNotification],
  )

  const total = pending.length + active.length + completed.length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-lg mt-1 shrink-0">
          <IconReview size={22} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">编审部</h1>
          <p className="text-sm text-gray-500 mt-1">
            承接已完成正文，围绕正文审阅与修订确认，完成后提交文集库。
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {total} 部作品（待审阅 / 审阅中 / 已完成审阅）
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">待审阅 {pending.length} 部</h2>
          {pending.length === 0 ? (
            <p className={EMPTY_CLASS}>暂无待审阅作品</p>
          ) : (
            pending.map(p => (
              <WorkCard
                key={p.id}
                p={p}
                onOpen={id => navigate(`/editorial/${id}`)}
                onAction={handleAction}
              />
            ))
          )}
        </section>
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">审阅中 {active.length} 部</h2>
          {active.length === 0 ? (
            <p className={EMPTY_CLASS}>暂无审阅中作品</p>
          ) : (
            active.map(p => (
              <WorkCard
                key={p.id}
                p={p}
                onOpen={id => navigate(`/editorial/${id}`)}
                onAction={handleAction}
              />
            ))
          )}
        </section>
        <section className="space-y-3 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">已完成审阅 {completed.length} 部</h2>
          {completed.length === 0 ? (
            <p className={EMPTY_CLASS}>暂无已完成审阅作品</p>
          ) : (
            completed.map(p => (
              <WorkCard
                key={p.id}
                p={p}
                onOpen={id => navigate(`/editorial/${id}`)}
                onAction={handleAction}
              />
            ))
          )}
        </section>
      </div>
    </div>
  )
}
