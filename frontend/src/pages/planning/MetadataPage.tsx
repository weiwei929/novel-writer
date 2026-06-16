import { IconTag } from '../../components/ui/icons'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function MetadataPage() {
  return (
    <PlaceholderPage
      icon={<IconTag className="w-7 h-7" />}
      title="作品设定（企划）"
      description="集中定型作品的名称、梗概与作品设定。本页为遗留入口，请优先使用作品详情页。"
    />
  )
}
