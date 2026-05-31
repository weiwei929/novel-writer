import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Lightbulb,
  ClipboardList,
  PenLine,
  ClipboardCheck,
  Library,
  Settings,
  Feather,
  LucideIcon,
} from 'lucide-react'

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
  icon: LucideIcon
  // 点击阶段 Tab 的默认落地路由
  to: string
  // 属于该阶段的路由前缀（用于高亮判定）
  match: string[]
  // 阶段内子导航（预留位，后续逐步填充）
  sub: SubNavItem[]
}

// 5 阶段创作管道：创意组 → 企划课 → 创作室 → 编审部 → 文集库
const PHASES: Phase[] = [
  {
    id: 'ideation',
    label: '创意组',
    icon: Lightbulb,
    to: '/creative/references',
    match: ['/creative'],
    sub: [
      { path: '/creative/references', label: '外来参考' },
      { path: '/creative/scraps', label: '灵感碎片' },
      { path: '/creative/ai-search', label: 'AI 搜索' },
      { path: '/creative/chat', label: '创意讨论' },
      { path: '/creative/proposals', label: '企划建议书' },
    ],
  },
  {
    id: 'planning',
    label: '企划课',
    icon: ClipboardList,
    // 默认落地「企划建议书」：企划课流程起点，与上游创意组产出对齐
    to: '/planning/proposals',
    match: ['/planning', '/projects'],
    sub: [
      { path: '/planning/proposals', label: '企划建议书' },
      { path: '/planning/metadata', label: '作品内容元数据' },
      { path: '/planning/evaluation', label: '立项评估' },
      { path: '/planning/projects', label: '立项作品' },
    ],
  },
  {
    id: 'writing',
    label: '创作室',
    icon: PenLine,
    to: '/editor',
    match: ['/editor'],
    sub: [{ path: '/editor', label: '写作编辑器' }],
  },
  {
    id: 'review',
    label: '编审部',
    icon: ClipboardCheck,
    to: '/review',
    match: ['/review'],
    sub: [{ path: '/review', label: '审阅工作台' }],
  },
  {
    id: 'library',
    label: '文集库',
    icon: Library,
    to: '/collections',
    match: ['/collections', '/stats'],
    sub: [
      { path: '/collections', label: '文集' },
      { path: '/stats', label: '数据统计' },
    ],
  },
]

const matchesPath = (pathname: string, target: string): boolean =>
  pathname === target || pathname.startsWith(target + '/')

const getActivePhase = (pathname: string): Phase | undefined =>
  PHASES.find(phase => phase.match.some(m => matchesPath(pathname, m)))

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const pathname = location.pathname
  const activePhase = getActivePhase(pathname)
  // 编辑器：导航不再全屏隐藏，改为收窄常驻
  const isEditor = pathname.startsWith('/editor')
  const settingsActive = matchesPath(pathname, '/settings')

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
        <Feather className={isEditor ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
      </div>
      {!isEditor && <h1 className="text-lg font-bold text-gray-900">小说创作器</h1>}
    </Link>
  )

  const settingsGear = (
    <Link
      to="/settings"
      title="系统设置"
      className={`flex items-center justify-center rounded-lg transition-colors ${
        isEditor ? 'w-8 h-8' : 'w-9 h-9'
      } ${
        settingsActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Settings className={isEditor ? 'w-4 h-4' : 'w-5 h-5'} />
    </Link>
  )

  // 编辑器模式：单行收窄导航，最大化创作空间，但导航始终可见。
  // 固定高度 flex 列：导航条占 h-12，编辑器铺满其下剩余空间。
  if (isEditor) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white border-b shrink-0 z-30">
          <div className="px-3 h-12 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {brand}
              {phaseTabs}
            </div>
            {settingsGear}
          </div>
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部：5 阶段主导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {brand}
              {phaseTabs}
            </div>
            {settingsGear}
          </div>
        </div>

        {/* 阶段内子导航区域（预留位，后续逐步填充子 Tab） */}
        {activePhase && (
          <div className="border-t bg-gray-50/80">
            <div className="container mx-auto px-4">
              <div className="flex items-center h-11 space-x-1">
                {activePhase.sub.map(item => {
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

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default Layout
