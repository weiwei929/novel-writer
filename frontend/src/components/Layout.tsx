import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  Edit,
  BarChart2,
  Settings,
  Upload,
  StickyNote,
  Archive
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/projects', label: '作品管理', icon: FileText },
    { path: '/collections', label: '素材/设定', icon: Archive },
    { path: '/scraps', label: '灵感碎片', icon: StickyNote },
    { path: '/editor', label: '写作编辑器', icon: Edit },
    { path: '/files', label: '文件管理', icon: Upload },
    { path: '/stats', label: '数据统计', icon: BarChart2 },
    { path: '/settings', label: '系统设置', icon: Settings },
  ]

  // 编辑器模式：沉浸式全屏，不显示导航栏
  if (location.pathname.startsWith('/editor')) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">小说创作器</h1>
            </Link>

            <nav className="flex items-center space-x-1">
              {navItems.map(item => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                const Icon = item.icon

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center space-x-3">
              <Link to="/stats" className="text-gray-600 hover:text-gray-900" title="统计信息">
                <BarChart2 className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default Layout
