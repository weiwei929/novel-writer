# Day 1 设计方案（2026-06-03 快照）

> **已 supersede**：2026-06-04 起请以 [`overall-architecture.md`](./overall-architecture.md) **v4.1** 为权威全文。  
> **入门**：`day1-handoff-brief.md` → v4.1 全文 → `v2-migration-map.md` → `code-conflict-analysis.md`  
> **注意**：§13 代码索引已过时，请以 `day1-vps-code-index.md` 为准。

---

## §0 项目一句话与背景

**一个人的小说创作器**：老板 = 作者本人，以 5 个不同身份参加不同阶段事务（有些阶段配 AI 助理）。重点打磨**创意组 + 创作室**，其他阶段（企划课/编审部/文集库）相对流程化。

**当前状态（2026-06-03）**：

- 创意组 4 Tab 已交付（TASK-011~102 共 12 卡，2026-06-02 完成）
- 纯讨论期；实现前须读 `day1-vps-code-index.md` 对齐已交付代码

**Day 1 锁定**（2026-06-03 讨论定案）：

- 企划课 4 Tab（企划建议书 / 立项评估 / 作品设定中 / 立项总账）
- 创作室 L1 三栏（待创作 / 创作中 / 作品已完成）
- 编辑器 pure-ified（移除作品级操作）
- 跨阶段不退回 + 全局墓园 + 软删除
- 7 个时间戳 + 11 个状态值

---

## §1 5 部门权力模型（Day 1 核心）

| 部门 | 状态范围 | 三选一节点 | 跨阶段退回 |
|------|---------|-----------|----------|
| 创意组 | creating / created / shelved | **created**（提案决策） | ❌ |
| 企划课 | planning / planned | **planning**（立项决策） | ❌ |
| 创作室 | planned / writing / written | **written**（提交审阅） | ❌ |
| 编审部 | reviewing / reviewed | **reviewed**（文集入库） | ❌ |
| 文集库 | archived | — | ❌ |

**关键不变量**：

1. 三选一只发生在 4 个「本阶段最后环节」节点（不是每个状态切换）
2. **跨阶段不退回**——部门 B 不能否决部门 A 的决定
3. 「退回」永远是本阶段 in-progress 状态的反悔（如 written→writing）
4. 任何状态都可「删除」到**全局墓园**（`deletedAt` 软删除）
5. 老板 = 作者本人；部门经理都是作者的不同身份

---

## §2 4 个三选一节点 + 7 个时间戳

```
节点 #1  创意组  created     → 提交企划课 / 退回（→ creating）/ 删除
节点 #2  企划课  planning    → 正式立项 / 退回（→ planning）/ 删除
节点 #3  创作室  written     → 提交审阅 / 退回（→ writing）/ 删除
节点 #4  编审部  reviewed    → 文集入库 / 退回（→ reviewing）/ 删除
```

**planned / writing 不是三选一节点**——是「工作中」状态：

- `planned`：只有「开始写作」和「删除」二选一
- `writing`：只有「作品已完成」和「删除」二选一

**7 个时间戳**（不变量，只增不减）：

```
project.submittedToPlanningAt   // #1 提交企划课
project.greenlitAt             // #2 正式立项
project.writingStartedAt       // #3 开始写作
project.workCompletedAt        // #4 作品已完成
project.submittedToReviewAt    // #5 提交审阅
project.archivedAt             // #6 文集入库
project.deletedAt              // 任何阶段可设的墓园标记
```

`greenlitAt IS NOT NULL` 是企划课 Tab ④「立项总账」的筛选条件。

---

## §3 状态机（11 个状态值）

| 状态 | 阶段 | 语义 | 进入条件 |
|------|------|------|---------|
| `imported` | 1.0 暂存 | 导入未处理 | 历史兼容（是否保留待 C-05 决议） |
| `creating` | 创意组 | 提案编辑中 | Proposal 初始态 |
| `created` | 创意组 | 提案完成 | Proposal.status='created' |
| `planning` | 企划课 | 作品筹备中 | 企划课「通过评估」后 |
| `planned` | 创作室 | 已立项未开工 | 企划课「正式立项」后 |
| `writing` | 创作室 | 创作中 | 创作室「开始写作」 |
| `written` | 创作室 | 全部完成 | 创作室「作品已完成」 |
| `reviewing` | 编审部 | 审阅中 | 创作室「提交审阅」 |
| `reviewed` | 编审部 | 审阅完成 | 编审部「审阅通过」 |
| `archived` | 文集库 | 已归档 | 编审部「文集入库」 |
| `shelved` | 任何 | 三选一退场 | 删除/退回到墓园前的临时态 |

**流转图**：

```
imported ─→ planning ─→ planned ─→ writing ─→ written ─→ reviewing ─→ reviewed ─→ archived
              ↑            ↑           ↑          ↑             ↑            ↑
              退回(本阶段) 退回(本阶段) 退回(本阶段) 退回(本阶段)  退回(本阶段) 退回(本阶段)

任何状态 ─────────────────────────────────────────────────────────→ deletedAt
                                          ↓
                                       全局墓园
```

> **实现备注（2026-06-03）**：VPS 已交付创意组使用独立 Proposal 流，迁入 Day 1 前需《已交付资产映射表》。见 `DAY1-DESIGN-REVIEW-2026-06-03.md`。

---

## §4 阶段隔离 + 跨阶段不退回

**字段随流程携带（不变量）**：

```
创意组 → 企划课:  Proposal（梗概+创新点+参考引用清单）
企划课 → 创作室:  Project 立项作品（元数据+章节规划+greenlitAt）
创作室 → 编审部:  全本正文（已完成章节+submittedToReviewAt）
编审部 → 文集库:  定稿作品（最终版+archivedAt）
```

**跨阶段不退回的实施**：

- 创作室 `written` 状态下的「撤销完成」= `written → writing`，**不回到企划课**
- 编审部 `reviewed` 状态下的「撤销定稿」= `reviewed → reviewing`，**不回到创作室**
- 如果觉得「上阶段做错了」，只能「上阶段重做」——回到上阶段 in-progress 状态继续修

---

## §5 企划课 4 Tab 设计

### 5.1 子导航与结构

```
L1 主导航: 企划课
L2 子导航: [企划建议书] [立项评估] [作品设定中] [立项总账]
L3 详情:   列表 → 点击进入详情/工作区（URL: ?from=planning）
```

### 5.2 完整流程

```
创意组 Proposal(created)
       │
       ▼ 【三选一节点 #1】Tab ② 立项评估
       │ 通过 → 新建 Project(planning, submittedToPlanningAt=now)
       │
       ▼
① 企划建议书（只读浏览入口）
       │
       ▼
② 立项评估（三选一：通过 / 退回 / 删除）
       │ 通过
       ▼
③ 作品设定中（三栏工作区：完善元数据/大纲/设定/风格）
       │ 【三选一节点 #2】正式立项（planning → planned, greenlitAt=now）
       ▼
④ 立项总账（greenlitAt IS NOT NULL 永久记录，与 status 解耦）
       │
       ▼ 作品状态独立流转（planned → writing → written → ... → archived）
```

### 5.3 Tab ① — 企划建议书

- 继承创意组提交的 Proposal，**只读**浏览
- 操作：「转入立项评估 →」跳转 Tab ②

### 5.4 Tab ② — 立项评估（**三选一节点 #1**）

- 数据源：`Proposal.status='created'`
- **通过** → 创建 `Project(status='planning', submittedToPlanningAt=now)`（Proposal 状态语义待映射表确认，设计原稿写 `shelved`，见审阅意见）
- **退回** → Proposal 回创意组可编辑态
- **删除** → `Proposal.deletedAt=now` → 墓园

### 5.5 Tab ③ — 作品设定中（**三选一节点 #2**）

- 数据源：`Project.status='planning'`
- 三栏：元数据 / 大纲 / 设定 / 风格
- 正式立项门控（3 必填）：标题+梗概 / 内容元数据 / 章节架构
- 「✨ 正式立项」→ `planning → planned`，`greenlitAt=now`

### 5.6 Tab ④ — 立项总账

- 数据源：`Project.greenlitAt IS NOT NULL`（**与 status 解耦**）
- 只读 + 导航出口；三选一决策在作品详情页
- 企划课看得到所有曾立项作品（含写作中/归档/墓园）；创作室待创作仅 `planned`

---

## §6 创作室设计

### 6.1 L1 三栏

| 栏 | status |
|----|--------|
| 待创作 | `planned` |
| 创作中 | `writing` |
| 作品已完成 | `written` |

### 6.2 各栏决策

- **planned**：开始写作 / 删除
- **writing**：继续写 / 作品已完成 / 删除
- **written**（节点 #3）：提交审阅 / 撤销完成 / 删除

### 6.3 作品详情页（work-level **唯一**场所）

- 实际实现目标文件：`WorkDetailPage.tsx`（见 `day1-vps-code-index.md`）
- 按 `status` 动态显示操作按钮，无状态下拉框
- URL：`?from=writing` / `?from=planning`

### 6.4 编辑器 pure-ified

- 实际实现目标文件：`WritingEditorPage.tsx`
- 仅章节级：保存 / 保存并标记完成
- **移除**：AI 助手、审阅、状态下拉、作品级操作

### 6.5 参考侧栏（5 板块）

本幕概要 / 角色速查 / 地点速查 / 写作风格（`Project.writingStyle`）/ 笔记备忘（`Chapter.notes`）

### 6.6 快速笔记

- 归宿：`Chapter.notes`
- 清理仅两选项：**保留 / 删除**（无「转灵感手记」）

---

## §7 全局规则

### 7.1 全局墓园

- L1 独立 🗑️ 入口；`Project.deletedAt`
- 软删除；可恢复 / 永久删除（二次确认）
- **取代** v2 的「审查池」与 `/shelf` 作品暂存（迁移策略见审阅文档）

### 7.2 软删除规则

- 默认过滤：`WHERE deletedAt IS NULL`
- 恢复：`deletedAt = null`，保留原 status

### 7.3 数据精修权限

| 数据 | 创意组 | 企划课 | 创作室 | 编审部 |
|------|--------|--------|--------|--------|
| 人物设定 | 创建+编辑 | 可编辑 | 可精修 | 可编辑 |
| 故事线 | 创建+编辑 | 可编辑 | 可编辑 | — |
| 写作风格 | — | 创建+编辑 | 只读 | 只读 |
| 作品内容元数据 | — | 创建 | 只读 | 只读 |

---

## §8 数据模型（schema 扩展）

### 8.1 Project 新增字段

```prisma
  writingStyle String?

  submittedToPlanningAt DateTime?
  greenlitAt            DateTime?
  writingStartedAt      DateTime?
  workCompletedAt       DateTime?
  submittedToReviewAt   DateTime?
  archivedAt            DateTime?
  deletedAt             DateTime?

  proposalId String?
  proposal   Proposal? @relation(...)

  @@index([deletedAt])
  @@index([greenlitAt])
  @@index([status])
```

### 8.2 Proposal 模型

> **VPS 备注**：Proposal **已存在**（含 innovation、metadata、references 等）。Day 1 为**扩展**而非新建。设计原稿字段见下，实现时合并：

```prisma
model Proposal {
  id          String   @id @default(uuid())
  title       String
  synopsis    String?
  innovations String?   // VPS 现字段名: innovation
  references  Json?
  status      String   @default("created")  // creating, created, shelved + 存量映射
  deletedAt   DateTime?
  project     Project?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 8.3 Chapter 新增

```prisma
  notes String?  // 章节级快速笔记
```

---

## §9 路由端点需求（13 个新端点）

| 端点 | 状态变化 | 时间戳 |
|------|---------|--------|
| `POST /proposals` | 新建 Proposal | - |
| `PUT /proposals/:id` | 更新 Proposal | - |
| `POST /proposals/:id/submit` | created | - |
| `POST /proposals/:id/accept-planning` | 创建 Project(planning) | submittedToPlanningAt |
| `POST /proposals/:id/reject` | 退回创意组 | - |
| `POST /projects/:id/greenlit` | planning→planned | greenlitAt |
| `POST /projects/:id/start-writing` | planned→writing | writingStartedAt |
| `POST /projects/:id/mark-written` | writing→written | workCompletedAt |
| `POST /projects/:id/submit-review` | written→reviewing | submittedToReviewAt |
| `POST /projects/:id/undo-written` | written→writing | workCompletedAt=null |
| `POST /projects/:id/archive` | reviewed→archived | archivedAt (Day 2) |
| `POST /projects/:id/soft-delete` | any→deletedAt | deletedAt |
| `POST /projects/:id/restore` | 恢复 | deletedAt=null |

> 设计原稿 `proposals/:id/greenlit` 易与 `projects/:id/greenlit` 混淆，上表已改名 `accept-planning`（实现时可再定）。

**现有端点改造**：

- `POST /projects/import` 保留，`status: 'imported'`
- `move-to-draft` → `move-to-planning`（`imported → planning`）
- `DELETE /projects/:id` → 软删除

---

## §10 冲突点摘要

详见 **`docs/design/code-conflict-analysis.md`**（含 C-01~C-13 与 8 步落地顺序）。

---

## §11 TASK 卡片索引

| 编号 | 内容 |
|------|------|
| TASK-200 | Schema 扩展：7 时间戳 + proposalId + writingStyle + deletedAt |
| TASK-201 | 扩展 Proposal 模型（非新建） |
| TASK-202 | Project.status 枚举扩展（11 值） |
| TASK-203 | 状态机迁移脚本 |
| TASK-204 | 路由：Proposal CRUD |
| TASK-205 | 路由：状态流转端点 |
| TASK-206 | L1 导航：5 阶段 + 🗑️ 墓园 |
| TASK-207~209 | 企划课 Tab ①~③ |
| TASK-209a | 企划课 Tab ④ 立项总账 |
| TASK-210~220 | 创作室 + 编辑器 pure + 墓园 + 主页 |
| TASK-230~233 | AI（Day 3） |
| TASK-240~242 | 编审部（Day 2） |

---

## §12 关键设计决策

### 12.1 已锁决策

5 部门模型 / 4 三选一节点 / 跨阶段不退回 / 墓园+deletedAt / writingStyle 顶层 / 编辑器 pure / 笔记二选一 / 立项总账解耦 / -ing/-ed 命名

### 12.2 待用户决策

- C-05：`imported` 是否保留（推荐保留）
- 创意组 TASK-101/102 与 Day 1 Proposal 语义映射（见审阅文档 D1~D4）

### 12.3 待 Day 2 / Day 3

编审部细节；AI 策略

---

## §13 现有代码索引（已迁移）

**请勿使用本节。** 请读：`docs/design/day1-vps-code-index.md`
