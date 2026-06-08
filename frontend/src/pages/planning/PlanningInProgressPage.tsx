import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../../services/api'
import { useUIStore } from '../../stores/uiStore'
import ProjectPickerView from '../../components/projects/ProjectPickerView'

export default function PlanningInProgressPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await projectsApi.getAll())
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '无法加载作品列表'
      setError(message)
      addNotification({ type: 'error', title: '加载失败', message })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    void load()
  }, [load])

  const planningProjects = useMemo(
    () => projects.filter(p => p.status === 'planning'),
    [projects]
  )

  return (
    <ProjectPickerView
      title="企划进行中"
      subtitle={`${planningProjects.length} 部企划进行中作品`}
      projects={planningProjects}
      loading={loading}
      error={error}
      emptyText="暂无企划进行中作品。接收入企划课后将出现在此。"
      phase="planning"
      onOpen={id => navigate(`/work/${id}?from=planning`)}
    />
  )
}
