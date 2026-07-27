import { Link } from 'react-router-dom'
import { IconBookOpen, IconArrowLeft } from '../../components/ui/icons'

export default function ReferencesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/creative/workspace" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <IconArrowLeft size={16} />返回创意组
      </Link>
      <div className="bg-white border rounded-xl p-12 text-center">
        <IconBookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">外来参考</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          汇集外部参考资料：文件导入、资料留存与点评留言将集中在这里，为创作提供素材支撑。详情页与导入改造将在后续迭代中接入。
        </p>
      </div>
    </div>
  )
}
