# 0608-status-context-labeling.md — 状态标签部门上下文化

> **状态**：现役 · 立宪级 · 2026-07-29 自 `docs/journal/0608-constitutional-guidance/` 取回 · 原文未改

> **文档角色**：定义状态标签系统如何从"全局字典"迁移为"部门上下文计算"。本文是前端重构的核心基础设施文档。
> **优先级**：P0 — 前端重构的依赖项。
> **关系**：引用 `0608-dept-workspace-model.md` §2（部门状态映射），输出 `0608-frontend-planning-workspace.md` 依赖的标签函数。

---

## §0 文档元信息

- 版本号、日期、维护人
- 术语表（department context、work area context、label function、fallback label）
- 与 api.ts `PROJECT_STATUS_LABEL` 的关系：本文定义抽象层，api.ts 定义具体实现

## §1 问题描述

现状与问题：

```
当前: PROJECT_STATUS_LABEL = {
  planning: '企划中',
  written: '已定稿',
   ...
}

问题:
- 'planning' 在企划课是三工作区之一的"进行中"，但在 creative dept 可以表示"已提交"
- 'written' 在创作室是"已完成"，在编审部是"待处理"
- 全局字典无法按用户所在视图解释 status
```

0608 §2 要求：

> 前端必须按当前部门上下文解释 status，不允许用一个全局中文标签解释所有页面。

## §2 标签函数原型

核心接口设计：

```
function depContextStatusLabel(
  department: DepartmentId,    // 'creative' | 'planning' | 'studio' | 'editorial' | 'library'
  workArea: WorkArea,          // 'pending' | 'active' | 'completed' | 'staging'
  status: ProjectStatus | ProposalStatus
): string
```

返回值规则：
1. department + workArea 确定"标签空间"（哪个工作区视图）
2. status 在该标签空间中查找
3. 找不到时回退到默认标签（显示原始 status 或 generic 中文标签）

具体签名、error handling、namespace 设计待实现团队决定。

## §3 各部门标签映射表

### 3.1 创意组（creative）

列表对象名：**创意作品**

| workArea | status/实体 | 标签 | 备注 |
|----------|-------------|------|------|
| active | CreativeFlow | "构思中" | 作品构思中，可写入、修改、保存构思内容 |
| completed | `created` | "已完成" | 提案已完成，等待提交企划课/暂存/退回构思 |

### 3.2 企划课（planning）

列表对象名：**企划作品**

| workArea | status | 标签 | 备注 |
|----------|--------|------|------|
| pending | `created`（Proposal）| "待企划" | 创意组提交的提案，等待接收入企划课 |
| pending | `planning` | "待处理" | （通常不出现——planning 应立即移入 active）|
| active | `planning` | "企划中" | 正在完善作品设定/元数据/章节架构，可写入、修改、保存企划内容 |
| completed | `planned` | "企划完成" | 企划课工作完成，等待放行 |
| — | `planned` | "已立项" | Tab ④ 立项总账语境下的"历史记录" |

### 3.3 创作室（studio）

列表对象名：**创作作品**

| workArea | status | 标签 | 备注 |
|----------|--------|------|------|
| pending | `planned` | "待创作" | 企划课已放行，等待首次开工 |
| active | `writing` | "创作中" | 可写入、修改、保存章节正文 |
| completed | `written` | "已完成" | 全部章节写完，等待放行编审部 |

### 3.4 编审部（editorial）

列表对象名：**审阅作品**

| workArea | status | 标签 | 备注 |
|----------|--------|------|------|
| pending | `written` | "待审阅" | 创作室刚放行 |
| active | `reviewing` | "审阅中" | 可写入、修改、保存批注和审阅记录 |
| completed | `reviewed` | "审阅完成" | 已确认，等待入库 |

### 3.5 文集库（library）

列表对象名：**文集作品**

| workArea | status | 标签 | 备注 |
|----------|--------|------|------|
| pending | `reviewed` | "待归库" | 编审部刚放行 |
| active | `reviewed` | "入库整理中" | 文集归属/标签/排序中 |
| completed | `archived` | "已归档" | 终态 |

### 3.6 文件暂存池（staging）

| workArea | status | 标签 | 备注 |
|----------|--------|------|------|
| — | 任意 | "软删于 {date} · 原状态：{status}" | 取自 deletedAt |
| — | — | "可恢复" | restore 动作可用 |
| — | — | "可永久删除" | 总经理级裁决 |

## §4 标签函数的实现位置

建议：

1. **核心函数**：放在 `frontend/src/utils/statusLabels.ts`
2. **枚举/类型**：扩展 `ProjectStatus` 和 `ProposalStatus` 类型定义
3. **React hook**（可选）：`useStatusLabel(department)` 返回当前部门上下文下的标签字典，避免在每个组件中反复传 department 参数
4. **Badge 组件重构**：`ProjectStatusBadge.tsx` 接收 department 参数而非从全局字典读取

## §5 与 StatusBadge 组件的集成

当前 `ProjectStatusBadge` 实现：

```tsx
export default function ProjectStatusBadge({ status }: { status: Project['status'] }) {
  const label = PROJECT_STATUS_LABEL[status] ?? status
  ...
}
```

集成后的目标接口：

```tsx
export default function ProjectStatusBadge({
  status,
  department,
  workArea,
}: {
  status: Project['status'] | Proposal['status']
  department?: DepartmentId   // 可选，默认用全局上下文的 department
  workArea?: WorkArea         // 可选，自动从 status + department 推断
}) {
  const label = depContextStatusLabel(department ?? guessDepartment(status), workArea, status)
  ...
}
```

## §6 迁移路径

| 步骤 | 内容 | 建议 TASK |
|------|------|----------|
| 1 | 新增 `statusLabels.ts`，实现 `depContextStatusLabel` | New Commit 1 |
| 2 | 重构 `ProjectStatusBadge.tsx`，加入 department 参数 | New Commit 1 |
| 3 | 三工作区列表页使用 `depContextStatusLabel(department, 'pending'|'active'|'completed', status)` | 新 Commit 1+ |
| 4 | 移除全局 `PROJECT_STATUS_LABEL`；或将其作为 `depContextStatusLabel` 的 fallback | Phase 2 |
| 5 | 所有旧页面（HomePage / Dashboard / 旧列表页）逐步迁移 | Phase 2+ |

## §7 不变量

1. 同一个 status 在不同部门可以有不同的标签，但同一部们 × 同一 workArea 下不能有歧义
2. `depContextStatusLabel` 必须是纯函数（无副作用，相同输入→相同输出）
3. 任何"按 status 显示标签"的 UI 组件必须经过该函数，不允许直接引用原始 status 字符串
4. 标签文案中文化：不要在枚举值中混入英文，所有面向用户的标签统一为中文

## §8 边界情况

- **未知 status**：`depContextStatusLabel` 收到不在映射表中的 status 时，返回原始 status 字符串 + console.warn
- **未知 department**：当 department 未提供且无法推断时，使用全局 fallback 字典
- **多值 status 同时匹配**：冲突时按优先级排序（department > workArea > 精确 status 匹配 > 模糊匹配 > fallback）
- **Proposal status vs Project status**：类型签名必须区分，避免 creative 部门的 `creating`（Proposal 的）与 创意组的 `creating` 混淆
