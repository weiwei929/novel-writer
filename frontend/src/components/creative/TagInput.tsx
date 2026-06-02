import { useState } from 'react'
import { IconClose } from '../ui/icons'

export interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

const TAG_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-violet-50 text-violet-700 border-violet-100',
]

function tagColor(tag: string) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h + tag.charCodeAt(i)) % TAG_COLORS.length
  return TAG_COLORS[h]
}

export default function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = '输入标签后按回车…',
}: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (raw: string) => {
    const t = raw.replace(/^#/, '').trim()
    if (!t || tags.includes(t)) return
    onChange([...tags, t])
    setInput('')
  }

  const unusedSuggestions = suggestions.filter(s => !tags.includes(s))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tagColor(tag)}`}
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter(x => x !== tag))}
              className="hover:opacity-70"
            >
              <IconClose size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(input)
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unusedSuggestions.slice(0, 8).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TagFilterBar({
  allTags,
  activeTag,
  onSelect,
}: {
  allTags: string[]
  activeTag: string | null
  onSelect: (tag: string | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-gray-400 mr-1">标签筛选</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-2.5 py-1 rounded-full border transition-colors ${
          activeTag === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
      >
        全部
      </button>
      {allTags.map(tag => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(activeTag === tag ? null : tag)}
          className={`px-2.5 py-1 rounded-full border transition-colors ${
            activeTag === tag
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  )
}
