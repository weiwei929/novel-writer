import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconCreative, IconFeather, IconLibrary, IconPlanning, IconReview, IconSettings, IconShelf, IconStats, IconWriting, IconComponent } from './ui/icons'
import { useSettingsStore } from '../stores/settingsStore'

interface LayoutProps {
  children: ReactNode
}

interface SubNavItem {
  path: string
  label: string
}

interface Phase {
  id: string
  label: string
  icon: IconComponent
  to: string
  match: string[]
  sub: SubNavItem[]
}

interface GlobalAction {
  path: string
  icon: IconComponent
  title: string
}

const PHASES: Phase[] = [
  {
    id: 'ideation',
    label: '创意组',
    icon: IconCreative,
    to: '/creative/scraps',
    match: ['/creative'],
    sub: [
      { path: '/creative/scraps', label: '灵感手记' },
      { path: '/creative/external-refs', label: '外来参考' },
      { path: '/creative/ai-search', label: 'AI 搜索' },
      { path: '/creative/chat', label: '创意讨论' },
      { path: '/creative/proposals', label: '企划建议书' },
    ],
  },
  {
    id: 'planning',
    label: '企划课',
    icon: IconPlanning,
    to: '/planning/proposals',
    match: ['/planning', '/projects', '/work'],
    sub: [
      { path: '/planning/proposals', label: '企划建议书评估' },
      { path: '/planning/metadata', label: '作品内容元数据' },
      { path: '/planning/evaluation', label: '立项评估' },
      { path: '/planning/projects', label: '立项作品' },
    ],
  },
  {
    id: 'writing',
    label: '创作室',
    icon: IconWriting,
    to: '/writing/projects',
    match: ['/writing', '/editor'],
    sub: [{ path: '/writing/projects', label: '创作中作品' }],
  },
  {
    id: 'review',
    label: '编审部',
    icon: IconReview,
    to: '/review',
    match: ['/review'],
    sub: [{ path: '/review', label: '审阅工作台' }],
  },
  {
    id: 'library',
    label: '文集库',
    icon: IconLibrary,
    to: '/library',
    match: ['/library', '/collections'],
    sub: [{ path: '/collections', label: '文集' }],
  },
]

const GLOBAL_ACTIONS: GlobalAction[] = [
  { path: '/stats', icon: IconStats, title: '数据统计' },
  { path: '/settings', icon: IconSettings, title: '系统设置' },
  { path: '/shelf', icon: IconShelf, title: '作品暂存' },
]

const matchesPath = (pathname: string, target: string): boolean =>
  pathname === target || pathname.startsWith(target + '/')

const getActivePhase = (pathname: string): Phase | undefined =>
  PHASES.find(phase => phase.match.some(m => matchesPath(pathname, m)))

const isWritingEditorPath = (pathname: string): boolean =>
  /^\/writing\/[^/]+\/[^/]+$/.test(pathname)

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const pathname = location.pathname
  const activePhase = getActivePhase(pathname)
  const isEditor = pathname.startsWith('/editor') || isWritingEditorPath(pathname)
  const aiPartner = useSettingsStore(s => s.ai.partner)

  const visibleSubNav =
    activePhase?.sub.filter(item => {
      if (!aiPartner && (item.path === '/creative/ai-search' || item.path === '/creative/chat')) {
        return false
      }
      return true
    }) ?? []

  const phaseTabs = (
    <nav className="flex items-center space-x-1">
      {PHASES.map(phase => {
        const isActive = activePhase?.id === phase.id
        const Icon = phase.icon
        return (
          <Link
            key={phase.id}
            to={phase.to}
            className={`flex items-center space-x-2 rounded-lg font-medium transition-colors ${
              isEditor ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
            } ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className={isEditor ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            <span>{phase.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const brand = (
    <Link to="/" className="flex items-center space-x-2.5 shrink-0">
      <div
        className={`bg-blue-600 rounded-lg flex items-center justify-center ${
          isEditor ? 'w-7 h-7' : 'w-8 h-8'
        }`}
      >
        <IconFeather className={isEditor ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
      </div>
      {!isEditor && <h1 className="text-lg font-bold text-gray-900">小说创作器</h1>}
    </Link>
  )

  const globalActions = (
    <div className="flex items-center gap-1">
      {GLOBAL_ACTIONS.map(({ path, icon: Icon, title }) => {
        const active = matchesPath(pathname, path)
        return (
          <Link
            key={path}
            to={path}
            title={title}
            className={`flex items-center justify-center rounded-lg transition-colors ${
              isEditor ? 'w-8 h-8' : 'w-9 h-9'
            } ${
              active
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className={isEditor ? 'w-4 h-4' : 'w-5 h-5'} />
          </Link>
        )
      })}
    </div>
  )

  if (isEditor) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white border-b shrink-0 z-30">
          <div className="px-3 h-12 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {brand}
              {phaseTabs}
            </div>
            {globalActions}
          </div>
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {brand}
              {phaseTabs}
            </div>
            {globalActions}
          </div>
        </div>

        {visibleSubNav.length > 0 && (
          <div className="border-t bg-gray-50/80">
            <div className="container mx-auto px-4">
              <div className="flex items-center h-11 space-x-1">
                {visibleSubNav.map(item => {
                  const isActive = matchesPath(pathname, item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-sm font-medium'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-white/70'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default Layout
