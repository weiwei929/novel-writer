import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DEPARTMENTS, getActiveDepartment } from '../../config/departmentNav'

interface DepartmentNavProps {
  onDepartmentNavigate: (to: string) => void
}

export default function DepartmentNav({ onDepartmentNavigate }: DepartmentNavProps) {
  const location = useLocation()
  const active = getActiveDepartment(location.pathname, location.search)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const pick = (to: string) => {
    setMenuOpen(false)
    onDepartmentNavigate(to)
  }

  return (
    <>
      <nav className="hidden lg:flex items-center gap-0.5 shrink-0" aria-label="五部门导航">
        {DEPARTMENTS.map(dept => {
          const isActive = active?.id === dept.id
          const Icon = dept.icon
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => pick(dept.to)}
              className={`we-dept-link flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive ? 'we-dept-link--active' : ''
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{dept.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="relative lg:hidden shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          className="we-dept-link px-2 py-1 rounded-md text-xs font-medium"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          部门{active ? ` · ${active.label}` : ''}
        </button>
        {menuOpen && (
          <div
            className="we-dept-menu-panel absolute left-0 top-full mt-1 z-50 min-w-[10rem] rounded-lg py-1"
            role="menu"
          >
            {DEPARTMENTS.map(dept => {
              const Icon = dept.icon
              const isActive = active?.id === dept.id
              return (
                <button
                  key={dept.id}
                  type="button"
                  role="menuitem"
                  onClick={() => pick(dept.to)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                    isActive ? 'font-semibold text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {dept.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
