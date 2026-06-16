import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../../services/api'
import { useUIStore } from '../../stores/uiStore'
import ProjectPickerView from '../../components/projects/ProjectPickerView'

export default function MetadataListPage() {
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

  // 企划课「作品内容元数据」：已立项（planning 及之后阶段）的项目
  const eligible = useMemo(
    () =>
      projects.filter(p =>
        ['planning', 'writing', 'reviewing', 'completed', 'archived'].includes(p.status)
      ),
    [projects]
  )

  return (
    <ProjectPickerView
      title="作品设定（企划）"
      subtitle={`${eligible.length} 部可编辑作品`}
      projects={eligible}
      loading={loading}
      error={error}
      emptyText="暂无已立项作品。请先在待企划作品评估中通过立项。"
      onOpen={id => navigate(`/planning/metadata/${id}`)}
    />
  )
}
