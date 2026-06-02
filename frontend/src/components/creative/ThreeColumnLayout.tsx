import { useState } from 'react'

export interface ThreeColumnLayoutProps {
  left: React.ReactNode
  middle: React.ReactNode
  right: React.ReactNode
  leftWidth?: string
  rightWidth?: string
  header?: React.ReactNode
}

export default function ThreeColumnLayout({
  left,
  middle,
  right,
  leftWidth = '240px',
  rightWidth = '280px',
  header,
}: ThreeColumnLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true)

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] min-h-[480px]">
      {header && <div className="shrink-0 mb-3">{header}</div>}
      <div className="flex flex-1 min-h-0 gap-3 relative">
        <button
          type="button"
          className="lg:hidden absolute top-2 left-2 z-10 px-2 py-1 text-xs bg-white border rounded shadow-sm"
          onClick={() => setLeftOpen(v => !v)}
        >
          {leftOpen ? '收起列表' : '展开列表'}
        </button>

        <aside
          className={`shrink-0 flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden transition-all ${
            leftOpen ? 'flex' : 'hidden'
          } lg:flex`}
          style={{ width: leftWidth, minWidth: leftWidth }}
        >
          {left}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
          {middle}
        </main>

        <aside
          className="shrink-0 hidden lg:flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden"
          style={{ width: rightWidth, minWidth: rightWidth }}
        >
          {right}
        </aside>
      </div>

      <div className="lg:hidden mt-3 border border-gray-200 rounded-xl bg-white overflow-hidden max-h-64 flex flex-col">
        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50">可引用区</div>
        <div className="flex-1 overflow-y-auto p-3">{right}</div>
      </div>
    </div>
  )
}
