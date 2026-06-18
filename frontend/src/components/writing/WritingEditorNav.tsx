import { IconArrowLeft, IconSave } from '../ui/icons'
import { useLocation } from 'react-router-dom'
import { GLOBAL_NAV_ACTIONS, matchesPath } from '../../config/departmentNav'
import DepartmentNav from './DepartmentNav'
import type { Chapter, Project } from '../../services/api'

type EditorMode = 'pure' | 'reference' | 'ai' | 'review'

interface WritingEditorNavProps {
  project: Project | null
  chapter: Chapter | null
  editorMode: EditorMode
  showAiMode: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  saving: boolean
  onGoBack: () => void
  onSave: () => void
  onSetMode: (mode: EditorMode) => void
  onToggleReference: () => void
  onGuardedNavigate: (to: string) => void
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
        active ? 'we-mode-btn--active' : 'we-nav-muted hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  )
}

export default function WritingEditorNav({
  project,
  chapter,
  editorMode,
  showAiMode,
  hasUnsavedChanges,
  lastSaved,
  saving,
  onGoBack,
  onSave,
  onSetMode,
  onToggleReference,
  onGuardedNavigate,
}: WritingEditorNavProps) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <header className="writing-editor-nav px-3 flex items-center gap-2 min-w-0 shrink-0 z-30">
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <button
          type="button"
          onClick={onGoBack}
          className="flex items-center gap-1 we-nav-muted hover:text-gray-900 shrink-0"
          title="返回作品详情"
        >
          <IconArrowLeft size={18} />
          <span className="text-xs hidden sm:inline">返回</span>
        </button>
        <div className="h-4 w-px bg-gray-200 shrink-0" />
        <div className="min-w-0 max-w-[240px]">
          <h1 className="text-sm font-semibold truncate">{project?.title || '加载中...'}</h1>
          {chapter && (
            <div className="text-xs we-nav-muted truncate">
              第 {chapter.order} 章 · {chapter.title}
              {hasUnsavedChanges && <span className="we-nav-warn ml-1">● 未保存</span>}
              {lastSaved && !hasUnsavedChanges && (
                <span className="ml-1">· {lastSaved.toLocaleTimeString()}</span>
              )}
              <span className="ml-1">· {chapter.wordCount?.toLocaleString() || 0} 字</span>
            </div>
          )}
        </div>
      </div>

      <DepartmentNav onDepartmentNavigate={onGuardedNavigate} />

      <div className="flex items-center gap-1 shrink-0">
        {GLOBAL_NAV_ACTIONS.map(({ path, icon: Icon, title }) => (
          <button
            key={path}
            type="button"
            title={title}
            onClick={() => onGuardedNavigate(path)}
            className={`we-global-action flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
              matchesPath(pathname, path) ? 'we-global-action--active' : ''
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 we-mode-seg rounded-lg p-0.5 shrink-0">
        <ModeButton active={editorMode === 'pure'} label="写作" onClick={() => onSetMode('pure')} />
        <ModeButton active={editorMode === 'reference'} label="参考" onClick={onToggleReference} />
        {showAiMode && (
          <ModeButton
            active={editorMode === 'ai'}
            label="AI"
            onClick={() => onSetMode(editorMode === 'ai' ? 'pure' : 'ai')}
          />
        )}
        <ModeButton
          active={editorMode === 'review'}
          label="审阅"
          onClick={() => onSetMode(editorMode === 'review' ? 'pure' : 'review')}
        />
      </div>

      {chapter && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className="we-btn-save flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium shrink-0"
        >
          <IconSave size={14} />
          {saving ? '...' : '保存'}
        </button>
      )}
    </header>
  )
}
