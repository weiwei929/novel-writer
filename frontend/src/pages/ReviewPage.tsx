import React from 'react'
import { Link } from 'react-router-dom'
import { IconBookOpen, IconCheckCheck, IconRefresh, IconReview, IconSparkles } from '../components/ui/icons'
import { useSettingsStore } from '../stores/settingsStore'

const ReviewPage: React.FC = () => {
  const aiAuditor = useSettingsStore(s => s.ai.auditor)
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4">
          <IconReview className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">编审部</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          作品定稿前的最后一道工序。审阅清单、连续阅读、修订对比与 AI 审查将集中在这里，
          目前正在建设中——你可以先到企划课挑选作品进入审阅。
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-amber-600 text-white px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <span>前往作品列表</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PlannedCard
          icon={<IconCheckCheck className="w-6 h-6" />}
          title="审阅清单"
          description="自定义检查项：角色名一致、时间线合理、章节字数均衡等。"
        />
        <PlannedCard
          icon={<IconBookOpen className="w-6 h-6" />}
          title="连续阅读模式"
          description="将选定章节拼接为连续文档，沉浸式通读全局。"
        />
        <PlannedCard
          icon={<IconRefresh className="w-6 h-6" />}
          title="修订对比"
          description="保存版本快照，修改后随时对比、安全回退。"
        />
        {aiAuditor && (
          <PlannedCard
            icon={<IconSparkles className="w-6 h-6" />}
            title="AI 审查"
            description="可选启动的智能审查，作为人工审阅的增值补充。"
          />
        )}
      </div>
    </div>
  )
}

interface PlannedCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

const PlannedCard: React.FC<PlannedCardProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start space-x-4">
    <div className="shrink-0 w-11 h-11 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <div className="flex items-center space-x-2 mb-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
          规划中
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
)

export default ReviewPage
