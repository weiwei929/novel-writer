import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'

const TABS = [
  { path: '/creative/scraps', label: '灵感手记', enabled: true },
  { path: '/creative/external-refs', label: '外来参考', enabled: true },
  { path: '/creative/ai-search', label: 'AI 搜索', enabled: false },
  { path: '/creative/chat', label: '创意讨论', enabled: false },
  { path: '/creative/proposals', label: '企划建议书', enabled: false },
] as const

export default function CreativePage() {
  const location = useLocation()

  if (location.pathname === '/creative' || location.pathname === '/creative/') {
    return <Navigate to="/creative/scraps" replace />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">创意组</h1>
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-px">
        {TABS.map(tab => {
          if (tab.enabled) {
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    isActive
                      ? 'border-amber-500 text-amber-800'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            )
          }
          return (
            <span
              key={tab.path}
              title="即将推出"
              className="px-4 py-2 text-sm text-gray-300 cursor-not-allowed border-b-2 border-transparent -mb-px"
            >
              {tab.label}
            </span>
          )
        })}
      </nav>

      <Outlet />
    </div>
  )
}
