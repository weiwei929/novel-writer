import {
  getProposalMetadata,
  proposalsApi,
  type FileReference,
  type Proposal,
  type ProposalMetadata,
  type Scrap,
} from './api'
import { parseScrapContent } from '../components/creative/scrapUtils'
import { normalizeWorkSetting, type WorkSetting } from './workSetting'

export type CreativeStage = 'origin' | 'conceiving' | 'formed'

export function getCreativeStage(meta: ProposalMetadata): CreativeStage | undefined {
  const s = meta._creativeStage
  if (s === 'origin' || s === 'conceiving' || s === 'formed') return s
  return undefined
}

export function creativeStageLabel(stage?: CreativeStage, status?: Proposal['status']): string {
  if (status === 'submitted' || status === 'evaluated') return '待企划作品'
  if (status === 'approved') return '已接收入企划课'
  switch (stage) {
    case 'origin':
      return '创意缘起'
    case 'conceiving':
      return '作品构思中'
    case 'formed':
      return '创意作品'
    default:
      return '作品构思中'
  }
}

/** 详情页大标题前缀，与徽标阶段语义一致 */
export function creativeStageHeading(stage?: CreativeStage, status?: Proposal['status']): string {
  if (status === 'submitted' || status === 'evaluated') return '待企划作品'
  if (status === 'approved') return '已接收入企划课'
  switch (stage) {
    case 'origin':
      return '创意缘起'
    case 'conceiving':
      return '作品创意构思'
    case 'formed':
      return '创意作品'
    default:
      return '作品创意构思'
  }
}

export async function advanceOriginToConceiving(
  id: string,
  proposal: Proposal,
  fields: {
    title: string
    synopsis: string
    innovation: string
    coreSetting: string
    tags: string[]
    settingSketch: WorkSetting
  }
): Promise<Proposal> {
  const meta = getProposalMetadata(proposal) as ProposalMetadata
  if (getCreativeStage(meta) !== 'origin') {
    throw new Error('仅创意缘起可升级为作品创意构思')
  }
  return proposalsApi.update(id, {
    title: fields.title.trim() || '未命名提案',
    synopsis: fields.synopsis,
    innovation: fields.innovation,
    coreSetting: fields.coreSetting,
    metadata: {
      ...meta,
      _creativeStage: 'conceiving',
      _tags: fields.tags,
      _settingSketch: normalizeWorkSetting(fields.settingSketch),
    },
  })
}

export async function createConceivingProposal(title: string): Promise<Proposal> {
  return proposalsApi.create({
    title: title.trim(),
    metadata: {
      _creativeStage: 'conceiving',
      _tags: [],
    },
  })
}

/** 从灵感碎片生成创意缘起；不写 references[] */
export async function createOriginFromScrap(scrap: Scrap): Promise<Proposal> {
  const { title, body } = parseScrapContent(scrap.content)
  const metadata: ProposalMetadata = {
    _creativeStage: 'origin',
    _sourceType: 'scrap',
    _sourceNote: `来自灵感碎片：${title}`,
  }
  return proposalsApi.create({
    title: title.trim() || '未命名创意缘起',
    synopsis: body.slice(0, 500) || undefined,
    metadata,
  })
}

/** 从外来参考提炼创意缘起；弱 _sourceRef，不写 references[] */
export async function createOriginFromExternalRef(ref: FileReference): Promise<Proposal> {
  const displayTitle = ref.metadata?.title || ref.fileName
  const metadata: ProposalMetadata = {
    _creativeStage: 'origin',
    _sourceType: 'external_ref',
    _sourceNote: `来自外来参考：${displayTitle}`,
    _sourceRef: { type: 'file_ref', id: ref.id, title: displayTitle },
  }
  return proposalsApi.create({
    title: displayTitle.trim() || '未命名创意缘起',
    metadata,
  })
}
