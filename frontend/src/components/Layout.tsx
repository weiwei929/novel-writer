import React, { ReactNode, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconBrandLogo, IconCreative, IconLibrary, IconPlanning, IconReview, IconSettings, IconShelf, IconStats, IconWriting, IconComponent } from './ui/icons'

interface LayoutProps { children: ReactNode }

interface Phase {
  id: string
  label: string
  icon: IconComponent
  to: string
  match: string[]
  tab: string
  tabActive: string
}

interface GlobalAction { path: string; icon: IconComponent; title: string }

const PHASES: Phase[] = [
  {
    id: 'ideation',
    label: '创意组',
    icon: IconCreative,
    to: '/creative/chat',
    match: ['/creative'],
    tab: 'text-amber-800 bg-amber-50/80 hover:bg-amber-100',
    tabActive: 'bg-amber-600 text-white shadow-sm',
  },
  {
    id: 'planning',
    label: '企划课',
    icon: IconPlanning,
    to: '/planning/proposals',
    match: ['/planning', '/projects'],
    tab: 'text-blue-800 bg-blue-50/80 hover:bg-blue-100',
    tabActive: 'bg-blue-600 text-white shadow-sm',
  },
  {
    id: 'writing',
    label: '创作室',
    icon: IconWriting,
    to: '/writing/projects',
    match: ['/writing', '/editor'],
    tab: 'text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100',
    tabActive: 'bg-indigo-600 text-white shadow-sm',
  },
  {
    id: 'review',
    label: '编审部',
    icon: IconReview,
    to: '/editorial',
    match: ['/editorial'],
    tab: 'text-orange-800 bg-orange-50/80 hover:bg-orange-100',
    tabActive: 'bg-orange-600 text-white shadow-sm',
  },
  {
    id: 'library',
    label: '文集库',
    icon: IconLibrary,
    to: '/library',
    match: ['/library'],
    tab: 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100',
    tabActive: 'bg-emerald-600 text-white shadow-sm',
  },
]

const GLOBAL_ACTIONS: GlobalAction[] = [
  { path: '/stats', icon: IconStats, title: '数据统计' },
  { path: '/settings', icon: IconSettings, title: '系统设置' },
  { path: '/shelf', icon: IconShelf, title: '文件暂存' },
]

const matchesPath = (pathname: string, target: string): boolean =>
  pathname === target || pathname.startsWith(target + '/')

const isWritingEditorPath = (pathname: string): boolean =>
  /^\/writing\/[^/]+\/[^/]+$/.test(pathname)

const isLegacyEditorPath = (pathname: string): boolean =>
  pathname === '/editor' || pathname.startsWith('/editor/')

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const pathname = location.pathname

  const getActivePhase = useCallback((path: string): Phase | undefined => {
    if (path.startsWith('/work/')) {
      const from = new URLSearchParams(location.search).get('from')
      if (from === 'writing') return PHASES.find(p => p.id === 'writing')
      if (from === 'planning') return PHASES.find(p => p.id === 'planning')
      return undefined
    }
    return PHASES.find(phase => phase.match.some(m => matchesPath(path, m)))
  }, [location.search])

  const activePhase = getActivePhase(pathname)
  const isEditor = isLegacyEditorPath(pathname) || isWritingEditorPath(pathname)

  const phaseTabs = (
    <nav className="flex items-center gap-1 w-max">
      {PHASES.map(phase => {
        const active = activePhase?.id === phase.id
        const Icon = phase.icon
        return (
          <Link key={phase.id} to={phase.to}
            className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              isEditor ? 'px-2 py-1.5 text-xs' : 'px-2.5 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm'
            } ${active ? phase.tabActive : phase.tab}`}
          ><Icon className="w-4 h-4 shrink-0" /><span>{phase.label}</span></Link>
        )
      })}
    </nav>
  )

  const brand = (
    <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
      <div className={`bg-red-900 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isEditor ? 'w-7 h-7' : 'w-8 h-8'}`}>
        <IconBrandLogo className={isEditor ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
      </div>
      {!isEditor && <h1 className="hidden sm:block text-lg font-bold text-gray-900 truncate">小说创作器</h1>}
    </Link>
  )

  const globalActions = (
    <div className="flex items-center gap-1">
      {GLOBAL_ACTIONS.map(({ path, icon: Icon, title }) => (
        <Link
          key={path}
          to={path}
          title={title}
          aria-label={title}
          className={`group relative flex items-center justify-center rounded-lg transition-colors ${
            isEditor ? 'w-8 h-8' : 'w-9 h-9'
          } ${matchesPath(pathname, path) ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Icon className={isEditor ? 'w-4 h-4' : 'w-5 h-5'} />
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {title}
          </span>
        </Link>
      ))}
    </div>
  )

  const appFooter = (
    <footer className="border-t border-gray-200 bg-white shrink-0">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-center gap-2 min-w-0 text-center text-xs text-gray-400">
          <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-md bg-gray-100">
            <IconBrandLogo className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p>小说创作器</p>
          <p>© 2026 Novel Writer</p>
        </div>
      </div>
    </footer>
  )

  if (isEditor) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white border-b shrink-0 z-30">
          <div className="px-3 h-12 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">{brand}{phaseTabs}</div>
            <div className="shrink-0">{globalActions}</div>
          </div>
        </header>
        <div className="flex-1 min-h-0 min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden flex flex-col">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:min-h-[4rem] min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0 shrink-0">
              {brand}
              <div className="sm:hidden shrink-0">{globalActions}</div>
            </div>
            <div className="min-w-0 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-1 sm:flex sm:justify-center">
              {phaseTabs}
            </div>
            <div className="hidden sm:block shrink-0">{globalActions}</div>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 py-4 sm:py-6">{children}</main>
      {appFooter}
    </div>
  )
}

export default Layout
