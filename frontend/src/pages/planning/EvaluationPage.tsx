import { Gauge } from 'lucide-react'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function EvaluationPage() {
  return (
    <PlaceholderPage
      icon={<Gauge className="w-7 h-7" />}
      title="立项评估"
      description="按评估模板对定型作品逐项审核，通过后正式立项进入创作室。立项评估流程开发中。"
    />
  )
}
