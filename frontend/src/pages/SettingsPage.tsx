import React, { useEffect, useState } from 'react'
import { aiApi } from '../services/api'
import { useSettingsStore, type AutoSaveDelay, type EditorFontSize, type EditorTheme } from '../stores/settingsStore'
import { useNotifications } from '../hooks/useNotifications'
import { IconRefresh, IconSave, IconSettings } from '../components/ui/icons'

type ConnStatus = 'checking' | 'connected' | 'error' | 'unconfigured'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function StatusDot({ status }: { status: ConnStatus }) {
  const cls =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'checking'
        ? 'bg-amber-400 animate-pulse'
        : status === 'unconfigured'
          ? 'bg-gray-400'
          : 'bg-red-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

const SettingsPage: React.FC = () => {
  const { success, error: notifyError } = useNotifications()
  const ai = useSettingsStore(s => s.ai)
  const editor = useSettingsStore(s => s.editor)
  const setAISettings = useSettingsStore(s => s.setAISettings)
  const setEditorSettings = useSettingsStore(s => s.setEditorSettings)

  const [draftEditor, setDraftEditor] = useState(editor)
  const [apiStatus, setApiStatus] = useState<ConnStatus>('checking')
  const [aiStatus, setAiStatus] = useState<ConnStatus>('checking')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setDraftEditor(editor)
  }, [editor])

  const checkServices = async () => {
    setApiStatus('checking')
    setAiStatus('checking')
    try {
      const r = await fetch('/health')
      setApiStatus(r.ok ? 'connected' : 'error')
    } catch {
      setApiStatus('error')
    }
    try {
      const r = await aiApi.checkStatus()
      if (r.status === 'available' || r.status === 'ok') setAiStatus('connected')
      else setAiStatus('unconfigured')
    } catch {
      setAiStatus('error')
    }
  }

  useEffect(() => {
    void checkServices()
  }, [])

  const handleTestConnection = async () => {
    setTesting(true)
    await checkServices()
    try {
      const result = await aiApi.testConnection()
      if (result.success) success('连接成功', result.model ? `模型: ${result.model}` : undefined)
      else notifyError('连接失败', result.error || '未知错误')
    } catch {
      notifyError('测试失败', '无法完成 AI 连接测试')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveEditorPrefs = () => {
    setEditorSettings(draftEditor)
    success('偏好已保存', '编辑器将在下次打开时应用')
  }

  const aiRows: { key: keyof typeof ai; title: string; hint: string }[] = [
    { key: 'partner', title: 'AI 创意合伙人', hint: '隐藏 AI 搜索 + 创意讨论 Tab' },
    { key: 'writer', title: 'AI 写作助手', hint: '隐藏 AI 写作助手面板' },
    { key: 'reviewer', title: 'AI 审校官-企划课', hint: '隐藏立项评估中的 AI 评估区域' },
    { key: 'auditor', title: 'AI 审校官-编审部', hint: '隐藏编审 AI 审校报告' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <IconSettings className="text-blue-600" size={24} />
        系统设置
      </h1>

      {/* AI 开关 */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-semibold text-gray-900">AI 功能开关</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {aiRows.map(row => (
            <li key={row.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <div className="font-medium text-gray-900">{row.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{row.hint}</div>
              </div>
              <Toggle
                label={row.title}
                checked={ai[row.key]}
                onChange={v => setAISettings({ [row.key]: v })}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* 编辑器偏好 */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-semibold text-gray-900">编辑器偏好</h2>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">主题</span>
              <select
                value={draftEditor.theme}
                onChange={e => setDraftEditor(d => ({ ...d, theme: e.target.value as EditorTheme }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="novel-light">浅色</option>
                <option value="novel-dark">深色</option>
                <option value="novel-sepia">羊皮纸</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">自动保存间隔</span>
              <select
                value={draftEditor.autoSaveDelay}
                disabled={!draftEditor.autoSave}
                onChange={e =>
                  setDraftEditor(d => ({
                    ...d,
                    autoSaveDelay: Number(e.target.value) as AutoSaveDelay,
                  }))
                }
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value={1000}>1 秒</option>
                <option value={2000}>2 秒</option>
                <option value={3000}>3 秒</option>
                <option value={5000}>5 秒</option>
              </select>
            </label>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">字体大小</span>
            <div className="flex flex-wrap gap-2">
              {([14, 16, 18, 20] as EditorFontSize[]).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDraftEditor(d => ({ ...d, fontSize: size }))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    draftEditor.fontSize === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 text-sm">自动保存</div>
              <div className="text-xs text-gray-500">编辑时定时保存章节</div>
            </div>
            <Toggle
              label="自动保存"
              checked={draftEditor.autoSave}
              onChange={v => setDraftEditor(d => ({ ...d, autoSave: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 text-sm">参考侧栏默认开启</div>
              <div className="text-xs text-gray-500">进入创作室时默认显示参考侧栏</div>
            </div>
            <Toggle
              label="参考侧栏"
              checked={draftEditor.referenceSidebar}
              onChange={v => setDraftEditor(d => ({ ...d, referenceSidebar: v }))}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveEditorPrefs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <IconSave size={16} />
              保存偏好
            </button>
          </div>
        </div>
      </section>

      {/* 服务状态 */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-semibold text-gray-900">服务状态</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">API 服务</span>
            <span className="flex items-center gap-2 text-gray-600">
              <StatusDot status={apiStatus} />
              {apiStatus === 'checking' && '检测中…'}
              {apiStatus === 'connected' && '已连接'}
              {apiStatus === 'error' && '连接失败'}
              {apiStatus === 'unconfigured' && '未配置'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">AI 服务</span>
            <span className="flex items-center gap-2 text-gray-600">
              <StatusDot status={aiStatus} />
              {aiStatus === 'checking' && '检测中…'}
              {aiStatus === 'connected' && '已连接'}
              {aiStatus === 'unconfigured' && '未配置'}
              {aiStatus === 'error' && '不可用'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleTestConnection()}
            disabled={testing}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <IconRefresh size={16} className={testing ? 'animate-spin' : ''} />
            测试连接
          </button>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
