import React from 'react'
import { Sparkles, Feather } from 'lucide-react'

export type EditorMode = 'pure' | 'ai'

interface DualModeSwitchProps {
  mode: EditorMode
  onChange: (mode: EditorMode) => void
}

const DualModeSwitch: React.FC<DualModeSwitchProps> = ({ mode, onChange }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        onClick={() => onChange('pure')}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'pure'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Feather size={14} className={mode === 'pure' ? 'text-green-600' : ''} />
        <span>纯净</span>
      </button>
      <button
        onClick={() => onChange('ai')}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'ai'
            ? 'bg-white text-blue-900 shadow-sm'
            : 'text-gray-500 hover:text-blue-900'
        }`}
      >
        <Sparkles size={14} className={mode === 'ai' ? 'text-blue-600' : ''} />
        <span>领航</span>
      </button>
    </div>
  )
}

export default DualModeSwitch
