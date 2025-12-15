import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle,
  Database,
  Server,
  Wifi,
  RefreshCw,
} from 'lucide-react'
import { collectionsApi, projectsApi, chaptersApi, aiApi } from '../services/api'

interface ApiTestResult {
  endpoint: string
  status: 'pending' | 'success' | 'error'
  message: string
  duration?: number
}

const ApiTestPage: React.FC = () => {
  const [tests, setTests] = useState<ApiTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0 })

  const apiTests = [
    {
      name: 'Backend Root Path',
      endpoint: '/',
      test: async () => {
        const response = await fetch('http://localhost:5000/')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return `根路径正常 - ${data.message || 'OK'}`
      },
    },
    {
      name: 'Backend Health Check',
      endpoint: '/health',
      test: async () => {
        const response = await fetch('http://localhost:5000/health')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return `服务健康 - ${data.status || 'OK'}`
      },
    },
    {
      name: 'Collections API - Get All',
      endpoint: '/api/v2/collections',
      test: async () => {
        const collections = await collectionsApi.getAll()
        return `成功获取 ${collections.length} 个文集`
      },
    },
    {
      name: 'Collections API - Create',
      endpoint: '/api/v2/collections',
      test: async () => {
        const collection = await collectionsApi.create({
          name: `测试文集_${Date.now()}`,
          description: '这是一个API测试文集',
          tags: ['测试'],
        })
        return `成功创建文集: ${collection.name}`
      },
    },
    {
      name: 'Projects API - Get All',
      endpoint: '/api/v2/projects',
      test: async () => {
        const projects = await projectsApi.getAll()
        return `成功获取 ${projects.length} 个项目`
      },
    },
    {
      name: 'Projects API - Create',
      endpoint: '/api/v2/projects',
      test: async () => {
        const project = await projectsApi.create({
          title: `测试项目_${Date.now()}`,
          description: '这是一个API测试项目',
          author: 'API测试员',
          genre: ['测试'],
          status: 'draft',
        })
        return `成功创建项目: ${project.title}`
      },
    },
    {
      name: 'Chapters API - Create',
      endpoint: '/api/v2/chapters',
      test: async () => {
        // 先获取一个项目ID
        const projects = await projectsApi.getAll()
        if (projects.length === 0) {
          throw new Error('需要先创建项目才能测试章节API')
        }

        const chapter = await chaptersApi.create({
          projectId: projects[0].id,
          title: `测试章节_${Date.now()}`,
          content: '这是一个API测试章节的内容。\n\n包含一些测试文字来验证字数统计功能。',
          order: 1,
        })
        return `成功创建章节: ${chapter.title}`
      },
    },
    {
      name: 'Chapters API - Get by Project',
      endpoint: '/api/v2/chapters',
      test: async () => {
        const projects = await projectsApi.getAll()
        if (projects.length === 0) {
          throw new Error('需要先创建项目才能测试章节获取')
        }

        const chapters = await chaptersApi.getByProjectId(projects[0].id)
        return `项目 ${projects[0].title} 有 ${chapters.length} 个章节`
      },
    },
    {
      name: 'Data Persistence Test',
      endpoint: 'File System',
      test: async () => {
        // 测试数据持久化
        const collections = await collectionsApi.getAll()
        const projects = await projectsApi.getAll()
        const totalItems = collections.length + projects.length
        return `数据持久化正常 - 共 ${totalItems} 条记录`
      },
    },
    {
      name: 'AI Context Injection (Tier A)',
      endpoint: '/api/v2/ai/chat',
      test: async () => {
        const projects = await projectsApi.getAll()
        if (projects.length === 0) throw new Error('Need a project to test context')
        const p = projects[0]
        
        // Verify backend accepts projectId without error
        await aiApi.chat(
            [{ role: 'user', content: 'What is this project about?' }],
            { projectId: p.id }
        )
        return `Successfully injected context for project: ${p.title}`
      },
    },
  ]

  const runTest = async (apiTest: (typeof apiTests)[0], index: number): Promise<void> => {
    const startTime = Date.now()

    setTests(prev => prev.map((test, i) => (i === index ? { ...test, status: 'pending' } : test)))

    try {
      const message = await apiTest.test()
      const duration = Date.now() - startTime

      setTests(prev =>
        prev.map((test, i) =>
          i === index
            ? {
                ...test,
                status: 'success',
                message,
                duration,
              }
            : test
        )
      )
    } catch (error) {
      const duration = Date.now() - startTime

      setTests(prev =>
        prev.map((test, i) =>
          i === index
            ? {
                ...test,
                status: 'error',
                message: error instanceof Error ? error.message : '未知错误',
                duration,
              }
            : test
        )
      )
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)

    // 初始化测试状态
    const initialTests = apiTests.map(test => ({
      endpoint: test.endpoint,
      status: 'pending' as const,
      message: '等待测试...',
    }))
    setTests(initialTests)

    // 顺序执行测试
    for (let i = 0; i < apiTests.length; i++) {
      await runTest(apiTests[i], i)
      // 在测试之间添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsRunning(false)
  }

  // 计算测试汇总
  useEffect(() => {
    const total = tests.length
    const passed = tests.filter(t => t.status === 'success').length
    const failed = tests.filter(t => t.status === 'error').length
    setSummary({ total, passed, failed })
  }, [tests])

  const getStatusIcon = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader size={20} className="animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'error':
        return <XCircle size={20} className="text-red-500" />
    }
  }

  const getStatusColor = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">API 连接测试</h1>
            <p className="text-gray-600 mb-6">验证前后端API连接和数据持久化功能</p>

            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <RefreshCw size={20} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? '测试中...' : '开始测试'}
            </button>
          </div>

          {/* 测试汇总 */}
          {tests.length > 0 && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Database size={24} className="mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">总测试数</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <CheckCircle size={24} className="mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-700">{summary.passed}</div>
                <div className="text-sm text-green-600">通过</div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg text-center">
                <XCircle size={24} className="mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                <div className="text-sm text-red-600">失败</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Wifi size={24} className="mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-700">
                  {summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-600">成功率</div>
              </div>
            </div>
          )}

          {/* 测试结果列表 */}
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-colors ${getStatusColor(test.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(test.status)}
                      <h3 className="font-medium text-gray-900">
                        {apiTests[index]?.name || `测试 ${index + 1}`}
                      </h3>
                      {test.duration && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {test.duration}ms
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <Server size={14} className="inline mr-1" />
                      {test.endpoint}
                    </div>

                    <div className="text-sm text-gray-700">{test.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tests.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">点击"开始测试"按钮来运行API连接测试</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiTestPage
