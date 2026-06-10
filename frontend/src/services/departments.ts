/**
 * 0608 五部门解析器 — 支持上下文感知
 *
 * 核心问题：同一 status 在不同部门有不同语义。
 *   planned  → 在企划课是"已完成"，在创作室是"待处理"
 *   written  → 在创作室是"已完成"，在编审部是"待处理"
 *   reviewed → 在编审部是"已完成"，在文集库是"待处理"
 *
 * 因此需要 viewedFrom 参数来区分调用者所在的部门上下文。
 */

export type Department = 'planning' | 'studio' | 'editorial' | 'library' | 'graveyard'
export type WorkArea = 'pending' | 'active' | 'completed'

export interface DepartmentContext {
  department: Department
  workArea: WorkArea
}

/** 0608 状态 → 默认"归属"部门 */
const STATUS_HOME: Record<string, Department> = {
  planning: 'planning',
  planned: 'planning',
  writing: 'studio',
  written: 'studio',
  reviewing: 'editorial',
  reviewed: 'editorial',
  archived: 'library',
}

/** 部门内的工作区语义（按归属部门） */
const HOME_WORK_AREA: Record<string, WorkArea> = {
  planning: 'active',
  planned: 'completed',
  writing: 'active',
  written: 'completed',
  reviewing: 'active',
  reviewed: 'completed',
  archived: 'completed',
}

/**
 * 边界状态在「下游部门」中的工作区语义。
 * 当 viewedFrom 是下游部门时，使用此覆盖。
 *
 * 0608 §2：
 *   planned 在创作室是 pending   → 企划课已放行，创作室待处理
 *   written 在编审部是 pending   → 创作室已放行，编审部待处理
 *   reviewed 在文集库是 pending  → 编审部已放行，文集库待处理
 */
const DOWNSTREAM_OVERRIDE: Record<string, Partial<Record<Department, { department: Department; workArea: WorkArea }>>> = {
  planned: { studio: { department: 'studio', workArea: 'pending' } },
  written: { editorial: { department: 'editorial', workArea: 'pending' } },
  reviewed: { library: { department: 'library', workArea: 'pending' } },
}

export function resolveDepartment(
  status: string,
  deletedAt?: string | null,
  viewedFrom?: Department | null
): DepartmentContext {
  // 墓园优先
  if (deletedAt) {
    return { department: 'graveyard', workArea: 'completed' }
  }

  // 如果有下游部门上下文，且当前状态是边界状态，使用下游覆盖
  if (viewedFrom) {
    const override = DOWNSTREAM_OVERRIDE[status]?.[viewedFrom]
    if (override) return override
  }

  // 默认按归属部门
  const dept = STATUS_HOME[status]
  if (!dept) {
    return { department: 'planning', workArea: 'pending' }
  }

  return { department: dept, workArea: HOME_WORK_AREA[status] ?? 'pending' }
}

export const DEPARTMENT_LABEL: Record<Department, string> = {
  planning: '企划课',
  studio: '创作室',
  editorial: '编审部',
  library: '文集库',
  graveyard: '墓园',
}
