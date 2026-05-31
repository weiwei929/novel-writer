import { ScrollText } from 'lucide-react'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function ProposalReviewPage() {
  return (
    <PlaceholderPage
      icon={<ScrollText className="w-7 h-7" />}
      title="企划建议书"
      description="评审创意组发来的企划建议书，筛选候选并决定是否立项。建议书评审流程开发中。"
    />
  )
}
