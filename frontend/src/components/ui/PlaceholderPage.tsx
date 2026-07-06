import React from 'react'

interface PlaceholderPageProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  icon,
  title,
  description,
  badge = '开发中',
}) => (
  <div className="max-w-3xl mx-auto">
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4">
        {icon}
      </div>
      <div className="flex items-center justify-center space-x-2 mb-3">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
          {badge}
        </span>
      </div>
      <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">{description}</p>
    </div>
  </div>
)

export default PlaceholderPage
