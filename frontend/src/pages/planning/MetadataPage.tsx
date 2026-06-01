import { IconTag } from '../../components/ui/icons'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function MetadataPage() {
  return (
    <PlaceholderPage
      icon={<IconTag className="w-7 h-7" />}
      title="作品内容元数据"
      description="集中定型作品的名称、梗概、标签等核心元数据，提交后进入立项评估。元数据定型面板开发中。"
    />
  )
}
