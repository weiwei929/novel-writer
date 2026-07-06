import { IconSearch } from '../../components/ui/icons'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function AiSearchPage() {
  return (
    <PlaceholderPage
      icon={<IconSearch className="w-7 h-7" />}
      title="AI 搜索"
      description="接入 AI 能力后，可在此进行智能资料检索与灵感发散。功能将随 AI 集成一并上线。"
    />
  )
}
