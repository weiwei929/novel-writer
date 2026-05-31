import { FileText } from 'lucide-react'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function ProposalsPage() {
  return (
    <PlaceholderPage
      icon={<FileText className="w-7 h-7" />}
      title="企划建议书"
      description="创意组沉淀的企划建议书将在此生成与管理，作为企划课立项的输入。待创意组产出流程打通后开放。"
    />
  )
}
