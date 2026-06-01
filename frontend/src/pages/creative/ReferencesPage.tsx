import { IconBookOpen } from '../../components/ui/icons'
import PlaceholderPage from '../../components/ui/PlaceholderPage'

export default function ReferencesPage() {
  return (
    <PlaceholderPage
      icon={<IconBookOpen className="w-7 h-7" />}
      title="外来参考"
      description="汇集外部参考资料：文件导入、资料留存与点评留言将集中在这里，为创作提供素材支撑。详情页与导入改造将在后续迭代中接入。"
    />
  )
}
