import React from 'react'
import { Loader, RefreshCw, XCircle, FileText } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  variant = 'spinner',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      default:
        return 'w-6 h-6'
    }
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )
      case 'pulse':
        return (
          <div className={`${getSizeClasses()} bg-blue-500 rounded-full animate-pulse`} />
        )
      default:
        return <Loader className={`${getSizeClasses()} animate-spin text-blue-500`} />
    }
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {renderSpinner()}
      {message && (
        <span className="text-sm text-gray-600">
          {message}
        </span>
      )}
    </div>
  )
}

interface LoadingStateProps {
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  className?: string
  minHeight?: string
  onRetry?: () => void
}

const LoadingState: React.FC<LoadingStateProps> = ({
  children,
  loading = false,
  error,
  empty = false,
  emptyMessage = '暂无数据',
  className = '',
  minHeight = 'h-32',
  onRetry
}) => {
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${minHeight} ${className}`}>
        <LoadingSpinner message="加载中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center ${minHeight} ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <XCircle className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            加载失败
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </button>
          )}
        </div>
      </div>
    )
  }

  if (empty) {
    return (
      <div className={`flex items-center justify-center ${minHeight} ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <FileText className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-600">
            {emptyMessage}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 骨架屏组件
interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: boolean
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false
}) => {
  return (
    <div
      className={`
        ${width} ${height} bg-gray-200 animate-pulse
        ${rounded ? 'rounded-full' : 'rounded'}
        ${className}
      `}
    />
  )
}

// 卡片骨架屏
const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="space-y-3">
        <Skeleton height="h-6" width="w-3/4" />
        <Skeleton height="h-4" />
        <Skeleton height="h-4" width="w-5/6" />
        <div className="flex space-x-2 pt-2">
          <Skeleton height="h-6" width="w-16" rounded />
          <Skeleton height="h-6" width="w-20" rounded />
        </div>
      </div>
    </div>
  )
}

export { LoadingSpinner, LoadingState, Skeleton, CardSkeleton }
export default LoadingSpinner