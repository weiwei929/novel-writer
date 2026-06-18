import {
  IconComponent,
  IconCreative,
  IconLibrary,
  IconPlanning,
  IconReview,
  IconSettings,
  IconShelf,
  IconStats,
  IconWriting,
} from '../components/ui/icons'

export interface Department {
  id: string
  label: string
  icon: IconComponent
  to: string
  match: string[]
}

export interface GlobalNavAction {
  path: string
  icon: IconComponent
  title: string
}

export const DEPARTMENTS: Department[] = [
  { id: 'ideation', label: '创意组', icon: IconCreative, to: '/creative/chat', match: ['/creative'] },
  { id: 'planning', label: '企划课', icon: IconPlanning, to: '/planning/proposals', match: ['/planning', '/projects'] },
  { id: 'writing', label: '创作室', icon: IconWriting, to: '/writing/projects', match: ['/writing', '/editor'] },
  { id: 'review', label: '编审部', icon: IconReview, to: '/editorial', match: ['/editorial'] },
  { id: 'library', label: '文集库', icon: IconLibrary, to: '/library', match: ['/library'] },
]

export const GLOBAL_NAV_ACTIONS: GlobalNavAction[] = [
  { path: '/stats', icon: IconStats, title: '数据统计' },
  { path: '/settings', icon: IconSettings, title: '系统设置' },
  { path: '/shelf', icon: IconShelf, title: '文件暂存' },
]

export const matchesPath = (pathname: string, target: string): boolean =>
  pathname === target || pathname.startsWith(target + '/')

export const isWritingEditorPath = (pathname: string): boolean =>
  /^\/writing\/[^/]+\/[^/]+$/.test(pathname)

export const isLegacyEditorPath = (pathname: string): boolean =>
  pathname === '/editor' || pathname.startsWith('/editor/')

export function getActiveDepartment(
  pathname: string,
  search: string,
): Department | undefined {
  if (pathname.startsWith('/work/')) {
    const from = new URLSearchParams(search).get('from')
    if (from === 'writing') return DEPARTMENTS.find(d => d.id === 'writing')
    if (from === 'planning') return DEPARTMENTS.find(d => d.id === 'planning')
    return undefined
  }
  return DEPARTMENTS.find(d => d.match.some(m => matchesPath(pathname, m)))
}
