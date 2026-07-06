import { z } from 'zod'

// 作品设定数据的归属：projectId（立项后）/ proposalId（提案阶段），恰好二选一。
export const ownerFields = {
  projectId: z.string().min(1).optional(),
  proposalId: z.string().min(1).optional(),
}

export const hasExactlyOneOwner = (d: {
  projectId?: string | null
  proposalId?: string | null
}): boolean => !!d.projectId !== !!d.proposalId

export const ownerRefine = {
  message: 'projectId 与 proposalId 必须二选一（恰好提供一个）',
}

// 根据查询参数构造 Prisma where 的归属过滤（XOR 已由 schema 校验保证）
export const ownerWhere = (q: { projectId?: string; proposalId?: string }) =>
  q.proposalId ? { proposalId: q.proposalId } : { projectId: q.projectId }
