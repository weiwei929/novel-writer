import React from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, FileText, Edit, BarChart3, Plus } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 欢迎区域 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">欢迎使用小说创作器</h1>
        <p className="text-xl text-gray-600 mb-8">
          专业的小说写作工具，让创作更简单、更高效
        </p>
        <Link
          to="/collections"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>开始创作</span>
        </Link>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <FeatureCard
          icon={<FolderOpen className="w-8 h-8" />}
          title="文集管理"
          description="组织和管理你的小说文集，支持分类和标签"
          linkTo="/collections"
          color="blue"
        />
        <FeatureCard
          icon={<FileText className="w-8 h-8" />}
          title="项目管理"
          description="创建和跟踪小说项目，管理章节和创作进度"
          linkTo="/projects"
          color="green"
        />
        <FeatureCard
          icon={<Edit className="w-8 h-8" />}
          title="写作编辑器"
          description="强大的Markdown编辑器，支持实时预览和AI辅助"
          linkTo="/editor"
          color="purple"
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="统计分析"
          description="查看写作统计，了解创作进度和成果"
          linkTo="/stats"
          color="orange"
        />
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/collections"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">创建新文集</h3>
              <p className="text-sm text-gray-600">开始一个新的创作项目</p>
            </div>
          </Link>
          <Link
            to="/projects"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">查看所有项目</h3>
              <p className="text-sm text-gray-600">管理现有的小说项目</p>
            </div>
          </Link>
          <Link
            to="/editor"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium">立即开始写作</h3>
              <p className="text-sm text-gray-600">使用编辑器进行创作</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  linkTo: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, linkTo, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  }

  const iconClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${iconClasses[color]} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        to={linkTo}
        className={`inline-block text-white px-4 py-2 rounded ${colorClasses[color]} transition-colors`}
      >
        了解更多
      </Link>
    </div>
  )
}

export default HomePage