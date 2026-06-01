import { IconAlert, IconArrowLeft, IconRefresh } from './icons'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 记录错误到外部服务（如果需要）
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoBack = () => {
    window.history.back()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <IconAlert className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">出现了意外错误</h2>
              <p className="mt-2 text-sm text-gray-600">
                应用程序遇到了一个意外的问题。请尝试以下解决方案：
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <IconRefresh className="w-4 h-4 mr-2" />
                  重试
                </button>

                <button
                  onClick={this.handleGoBack}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <IconArrowLeft className="w-4 h-4 mr-2" />
                  返回上一页
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <IconRefresh className="w-4 h-4 mr-2" />
                  重新加载页面
                </button>
              </div>

              {/* 错误详情（开发模式或显式启用时显示） */}
              {(this.props.showDetails || import.meta.env.DEV) && this.state.error && (
                <div className="mt-6">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      查看错误详情
                    </summary>
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-mono text-xs text-red-700 mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </p>
                      <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">如果问题持续存在，请联系技术支持</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 函数式组件错误边界包装器
interface AsyncErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error) => void
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ children, onError }) => {
  return (
    <ErrorBoundary
      onError={(error, _errorInfo) => {
        if (onError) {
          onError(error)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// 简化的错误显示组件
interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  className?: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className = '' }) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <IconAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">出现错误</h3>
      <p className="text-sm text-gray-600 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          <IconRefresh className="w-4 h-4 mr-2" />
          重试
        </button>
      )}
    </div>
  )
}

export default ErrorBoundary
