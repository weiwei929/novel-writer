# TASK: 创意组 0608 合规只读审计

> **范围**：只读审计 — 不修改、不 stage、不 commit、不 push
> **依据**：`0608-creative-workspace.md`（P4 设计就位）+ `0608-legacy-freeze-list.md`（F-001~F-002）

---

## 审计范围

### 前端文件

| # | 文件 | 角色 |
|---|------|------|
| 1 | `frontend/src/pages/CreativePage.tsx` | 创意组主页面（4 Tab 布局） |
| 2 | `frontend/src/pages/creative/ProposalDetailPage.tsx` | 提案详情/编辑页 |
| 3 | `frontend/src/pages/creative/ProposalsPage.tsx` | 企划建议书列表 |
| 4 | `frontend/src/pages/planning/ProposalReviewPage.tsx` | 企划课 → 待评估列表 |
| 5 | `frontend/src/pages/planning/ProposalEvalPage.tsx` | 企划课 → 提案评估页 |
| 6 | `frontend/src/components/creative/PlanningProposal.tsx` | 创意 Tab 内企划建议书组件 |
| 7 | `frontend/src/components/creative/CreativeDiscussion.tsx` | 创意讨论三栏组件 |
| 8 | `frontend/src/components/proposals/ProposalStatusBadge.tsx` | 提案状态标签组件 |
| 9 | `frontend/src/services/statusLabels.ts` | 提案标签服务 |
| 10 | `frontend/src/services/filters.ts` | 提案过滤器 |
| 11 | `frontend/src/services/status-migration.ts` | 状态迁移映射 |
| 12 | `frontend/src/services/api.ts` | proposalsApi 定义 |

### 后端文件

| # | 文件 | 角色 |
|---|------|------|
| 13 | `backend/src/routes/proposals.ts` | 提案端点 |
| 14 | `backend/src/services/status-migration.ts` | 后端状态映射 |

---

## 审计检查项

### A. 旧语义残留检查（对照 0608-creative-workspace.md §3 合规表 + freeze list）

每个文件逐项排查：

**A1. `approve` 是否被误用为"立项"**
- 前端是否存在 `approve` 调用的用户动作
- 后端 `approve` 端点是否与 `accept-into-planning` 重复
- 文案是否使用了"立项"措辞（0608 规定：创意组不"立项"，企划课"接收入企划课"）

**A2. `reject` 是否仍暴露给用户**（F-002 冻结）
- 前端是否有 reject 按钮/动作/用户路径
- 后端 reject 端点是否仍存活
- 文案是否包含"退回创意组重做提案"等措辞

**A3. `shelve` 是否仍暴露给用户**（0608-creative-workspace.md §3.3："Proposal 不设 `shelved`"）
- 前端是否有 shelve 按钮/动作/用户路径
- 后端 shelve 路径在 proposal 上下文中是否仍存活
- 文案是否包含"暂存"措辞

**A4. "退回创意组重做提案"是否存在**
- 任何将 proposal status 设置为 `creating`（或旧 `rejected`→`creating` 映射）的用户路径
- 组件中是否有"退回"相关按钮/文案

**A5. `creating` / `created` 能否表达当前语义**
- 前端代码中是否直接使用旧字面量（`draft`/`submitted`/`evaluated`）而非映射后的 `creating`/`created`
- status-migration.ts 映射表是否完整覆盖所有状态

### B. 流程清晰度检查（对照 0608-creative-workspace.md §0-§2）

**B1. 创意来源 → 创意讨论 → 创意提案 链路**
- CreativeDiscussion → submit → ProposalDetailPage 流程是否通畅
- submit 动作语义是否等于 `creating→created`（提交提案，而非"立项"）

**B2. 提案 submit 后进入企划课待处理**
- 提案 `created`（即旧 `submitted`）后是否出现在企划课 Tab ② 的 ProposalReviewPage
- 创意组是否仍错误承担企划课审批职责

**B3. 企划课接收是否明确属于企划课动作**
- `accept-into-planning` 端点是否仅在企划课上下文中使用
- 创意组 Tab "企划建议书"中是否出现了评估/审批 UI（应是企划课职责）

**B4. 跨部门退回禁令**
- 企划课是否有退回创意组的用户路径（F-001 冻结）

### C. 路由/上下文检查

**C1. 创意组路由 `/creative/proposals`**
- 当前为该路由渲染的组件是什么？（已知：PlanningProposal）
- 该组件的行为是否符合创意组角色（只查看提案列表），还是侵入了企划课角色（评估/审批）

**C2. 企划课路由 `/planning/proposals` 和 `/planning/proposals/:id`**
- ProposalReviewPage 和 ProposalEvalPage 的行为是否正确

---

## 审计方法

对每个文件执行：

```bash
# 阅读文件内容，逐行检查
cat <filepath>

# 对可疑的语义残留，全局搜索确认影响面
grep -rn "approve\|reject\|shelve\|evaluate\|退回\|暂存\|立项" --include="*.tsx" --include="*.ts" frontend/src/ | grep -v node_modules | grep -v ".d.ts"
```

---

## 产出格式

按以下四类归档每条发现：

```
### [文件路径]
#### ✅ 已实现且符合 0608
- (清单)

#### ⚠️ 已实现但语义/上下文不符合 0608
- 位置: 行号
- 问题: (描述)
- 0608依据: (引用设计文档具体章节)
- 影响面: (前端UI/后端API/数据/文案)

#### ❌ 缺失且属当前必须补齐
- (清单 — 如果有)

#### 📋 后续阶段处理
- (清单 — 非阻塞，可推后)
```

### 每条 ⚠️ 和 ❌ 条目需附：

1. **代码真实状态** — 当前代码确实做了什么
2. **文案问题** — 用户看到的文字是否误导
3. **路由/动作问题** — 按钮点了去哪/做什么
4. **数据模型/接口兼容问题** — 后端是否仍接受旧状态值
5. **Legacy 但当前无用户路径** — 仅代码中存在但不可达的死路径

---

## 审计结论

报告末尾请做总结：

```
=== 审计结论 ===
总发现: X 条（✅ N / ⚠️ N / ❌ N / 📋 N）

需司令部会诊项:
1. (最关键的决策项)
2. ...

建议：
- (哪些可立即修复，哪些需决策后修复)
```

---

## 约束

- ❌ 不修改任何文件
- ❌ 不 stage / commit / push
- ✅ 仅读取、grep、git log、git show
