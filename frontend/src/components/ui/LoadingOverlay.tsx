import React from 'react'
import { Loader } from 'lucide-react'
import { useUI } from '../../contexts/UIContext'

const LoadingOverlay: React.FC = () => {
  const { state } = useUI()
  
  if (!state.loading.isLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          请稍候...
        </h3>
        
        {state.loading.message && (
          <p className="text-sm text-gray-600 mb-4">
            {state.loading.message}
          </p>
        )}
        
        {state.loading.progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.loading.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadingOverlay