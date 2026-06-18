# TASK: 创意组前端用户路径合规收口 — 范围评估

> **模式**：只评估，不修改
> **基线**：`v2-dev` @ `2e131ab`（HEAD）
> **状态**：司令部 D1/D2 已裁定

---

## 司令部裁定

### D1：`/creative/proposals` UI 形态 → **B：保持两区，全区只读**

| 原文案 | 新文案 | 动作 |
|--------|--------|------|
| 待评估 | 已提交 / 待企划接收 | 纯信息展示，无按钮 |
| 已评估 | 已接收入企划课 | 只保留「查看作品」「查看提案」链接 |
| 评估按钮 | ❌ 移除 | approve/reject/shelve/evaluate 全部禁止 |
| 送审按钮 | ❌ 移除 | 见 D2 |

### D2：列表 draft→submitted 按钮 → **B：移除**

- `/creative/proposals` 不再承担任何提交操作
- 提交只保留在 `CreativeDiscussion`（创意讨论页）和 `ProposalDetailPage`（提案详情页）
- `/creative/proposals` 定位为**创意提案状态列表 / 查看入口**

---

---

## 司令部补充裁定

### R1（风险项）：pending 区"已提交 / 待企划接收"必须保留"查看详情"入口

- 每行 pending 提案须可点击进入 `/creative/proposals/:id`
- 实现方式：整行可点击 `onClick` 或用 `<Link>` 包裹标题列
- 参考 evaluated 区已有 `查看提案` / `查看作品` 链接的样式

---

## 执行模式

**模式**：单 commit，执行修改
**涉及**：4 文件（PlanningProposal.tsx / ProposalDetailPage.tsx / api.ts / ProposalEvalPage.tsx）
**Commit message**：`fix(frontend): align creative proposal paths with 0608`
**回报格式**：
- `git diff --cached --stat`
- `git diff --cached --name-only`
- 4 文件 staged diff 摘要
- staged-only build 结果
- commit hash
- 是否已 push

---

## 修改范围

### 文件 1：`frontend/src/components/creative/PlanningProposal.tsx`

| # | 改动 | 类型 |
|---|------|------|
| 1a | 移除 `IconClose` import（评估 modal 唯一使用者） | 删除 |
| 1b | 移除 `handleEvaluate` 函数（L49-68） | 删除 ~20 行 |
| 1c | 移除 `evaluating` / `acting` 状态变量（L16-17） | 删除 |
| 1d | 移除整个评估 modal JSX（L167-223） | 删除 ~57 行 |
| 1e | 移除 pending 列表中"评估"按钮（L119-127） | 删除 |
| 1f | 移除 pending 列表中 draft 子项的"送审"按钮（L111-118）+ `submitToReview` 函数（L70-78） | 删除 |
| 1g | pending 过滤改用 `isProposalSubmittable` / `mapProposalStatus`（替代 L38-39 裸 `'submitted'`/`'draft'`） | 修改 |
| 1h | evaluated 过滤改用 `isProposalApproved` / 语义层（替代 L45 裸 `['approved', 'rejected', 'shelved', 'evaluated']`） | 修改 |
| 1i | pending 区文案：标题"待评估" → "已提交 / 待企划接收"；空态文案对齐 | 修改 |
| 1i-r1 | pending 区每行须有"查看详情"入口 → `/creative/proposals/:id`（R1 修正） | 新增 |
| 1j | evaluated 区文案：标题"已评估" → "已接收入企划课" | 修改 |
| 1k | 引入 `filters.ts` / `status-migration.ts` import | 新增 |

### 文件 2：`frontend/src/pages/creative/ProposalDetailPage.tsx`

| # | 改动 | 类型 |
|---|------|------|
| 2a | 移除 `handleShelve` 函数（L96-105） | 删除 ~10 行 |
| 2b | 移除"暂存"按钮 JSX（L242-250） | 删除 |
| 2c | "进入企划建议书" → "提交创意提案"（L239 按钮文案 + L87 success 文案） | 修改 |
| 2d | 条件 `proposal.status === 'draft'` 改用 `mapProposalStatus` 语义（L232） | 修改 |
| 2e | `updateStatus(id, 'submitted')` 保留（后端兼容），文案已反映创意组职责 | 保留 |

### 文件 3：`frontend/src/services/api.ts`

| # | 改动 | 类型 |
|---|------|------|
| 3a | 新增 `acceptIntoPlanning(id: string)` wrapper → `POST /proposals/:id/accept-into-planning` | 新增 ~6 行 |

### 文件 4：`frontend/src/pages/planning/ProposalEvalPage.tsx`

| # | 改动 | 类型 |
|---|------|------|
| 4a | `proposalsApi.approve(id)` → `proposalsApi.acceptIntoPlanning(id)` | 修改 1 行 |
| 4b | 响应解构 `const { projectId } = ...` 不变（两端点响应格式相同） | 不修改 |

---

## 产出格式

请对每个改动逐项确认：

```
=== SCOPE ASSESSMENT ===

## 文件 1：PlanningProposal.tsx
1a 移除 IconClose import: 可行，-1 line
1b 移除 handleEvaluate: 可行，-20 lines, 连带移除 evaluate import（api.ts）
1c 移除 evaluating/acting state: 可行，-2 lines
1d 移除评估 modal JSX: 可行，-57 lines
1e 移除"评估"按钮: 可行，-9 lines
1f 移除"送审"按钮 + submitToReview: 可行，-10 lines
1g pending 过滤改用语义层: 可行，~+2/-2 lines, 新增 import filters
1h evaluated 过滤改用语义层: 可行，~+2/-2 lines
1i pending 区文案更新: 可行，~+2/-2 lines
1j evaluated 区文案更新: 可行，~+1/-1 lines
1k 新增 import: ~+2 lines
总计: 约 -110 / +10 lines

## 文件 2：ProposalDetailPage.tsx
2a 移除 handleShelve: 可行，-10 lines
2b 移除"暂存"按钮: 可行，-8 lines
2c 文案替换: 可行，-2 lines
2d status 条件改用语义层: 可行，+1/-1 lines, 新增 import
总计: 约 -22 / +3 lines

## 文件 3：api.ts
3a 新增 acceptIntoPlanning: 可行，+6 lines

## 文件 4：ProposalEvalPage.tsx
4a approve → acceptIntoPlanning: 可行，0 net lines
总计: 约 +6 lines (net)

=== 汇总 ===
总 diff: ~123 行删除 / ~19 行新增
涉及文件: 4
风险项: (如有)
Build 验证: (是否需要)
```

---

## 约束

- ❌ 不改 backend routes
- ❌ 不改 schema
- ❌ 不碰 AI / Review / Reader / P3 / P4
- ❌ 不直接 cherry-pick WT 草稿（仅可参考）
- ❌ 不 stage / commit / push（本次只评估）
- ✅ 基于 HEAD `2e131ab` 做静态分析
