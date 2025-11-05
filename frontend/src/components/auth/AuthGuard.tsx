/**
 * 应用认证组件
 * 单用户密码验证界面
 */

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

interface AuthStatus {
  requireAuth: boolean
  authenticated: boolean
  message: string
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('novel_auth_token')
      const response = await fetch('/auth/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAuthStatus(result.data)
      } else {
        setAuthStatus({
          requireAuth: true,
          authenticated: false,
          message: '需要认证'
        })
      }
    } catch (error) {
      console.error('认证状态检查失败:', error)
      setAuthStatus({
        requireAuth: true,
        authenticated: false,
        message: '连接失败'
      })
    }
  }

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()

      if (result.success) {
        // 保存认证令牌
        localStorage.setItem('novel_auth_token', result.data.sessionId)
        
        // 更新认证状态
        setAuthStatus({
          requireAuth: true,
          authenticated: true,
          message: result.data.message
        })
        
        setPassword('')
      } else {
        setError(result.error?.message || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      setError('网络连接失败，请检查后端服务')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理登出
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('novel_auth_token')
      
      await fetch('/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      localStorage.removeItem('novel_auth_token')
      setAuthStatus(prev => prev ? { ...prev, authenticated: false } : null)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 加载中状态
  if (!authStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查认证状态...</p>
        </div>
      </div>
    )
  }

  // 不需要认证或已认证，直接显示应用
  if (!authStatus.requireAuth || authStatus.authenticated) {
    return (
      <div>
        {/* 认证状态栏 */}
        {authStatus.requireAuth && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-sm">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <span className="text-green-800">✅ 已通过认证</span>
              <button
                onClick={handleLogout}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    )
  }

  // 显示登录界面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            小说创作器
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请输入应用密码以继续使用
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="password" className="sr-only">
              应用密码
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="输入应用密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  验证中...
                </div>
              ) : (
                '进入应用'
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>💡 提示：默认密码是 "novel2024"</p>
            <p>🔒 这是本地单用户应用，密码仅用于防止误操作</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthGuard