import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../../services/api'
import { useUIStore } from '../../stores/uiStore'
import ProjectPickerView from '../../components/projects/ProjectPickerView'

export default function WritingProjectsPage() {
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
    } catch (e: any) {
      setError(e?.message || '无法加载作品列表')
      addNotification({ type: 'error', title: '加载失败', message: '无法加载作品列表' })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    void load()
  }, [load])

  const writingProjects = useMemo(
    () => projects.filter(p => p.status === 'writing'),
    [projects]
  )

  return (
    <ProjectPickerView
      title="创作室"
      subtitle={`${writingProjects.length} 部创作中作品`}
      projects={writingProjects}
      loading={loading}
      error={error}
      emptyText="暂无创作中作品。作品进入「创作中」状态后将出现在此。"
      onOpen={id => navigate(`/writing/${id}`)}
    />
  )
}
