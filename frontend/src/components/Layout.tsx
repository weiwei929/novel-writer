import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconFeather } from './ui/icons'
import {
  DEPARTMENTS,
  GLOBAL_NAV_ACTIONS,
  getActiveDepartment,
  isLegacyEditorPath,
  isWritingEditorPath,
  matchesPath,
} from '../config/departmentNav'

interface LayoutProps { children: ReactNode }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const pathname = location.pathname

  const activePhase = getActiveDepartment(pathname, location.search)
  const isEditor = isLegacyEditorPath(pathname) || isWritingEditorPath(pathname)

  const phaseTabs = (
    <nav className="flex items-center gap-1 w-max">
      {DEPARTMENTS.map(phase => {
        const active = activePhase?.id === phase.id
        const Icon = phase.icon
        return (
          <Link key={phase.id} to={phase.to}
            className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm ${
              active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          ><Icon className="w-4 h-4 shrink-0" /><span>{phase.label}</span></Link>
        )
      })}
    </nav>
  )

  const brand = (
    <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
        <IconFeather className="w-5 h-5 text-white" />
      </div>
      <h1 className="hidden sm:block text-lg font-bold text-gray-900 truncate">小说创作器</h1>
    </Link>
  )

  const globalActions = (
    <div className="flex items-center gap-1">
      {GLOBAL_NAV_ACTIONS.map(({ path, icon: Icon, title }) => (
        <Link key={path} to={path} title={title}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
            matchesPath(pathname, path) ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        ><Icon className="w-5 h-5" /></Link>
      ))}
    </div>
  )

  if (isEditor) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <div className="flex-1 min-h-0 min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
      <main className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  )
}

export default Layout
