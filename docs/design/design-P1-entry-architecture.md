# P1 入口架构治理方案

> **状态**：现役 · 已收束，保留作实现依据 · 最后核对 2026-07-27
> ⚠️ 文中基线指向分支 `v2-dev`，该分支已于 2026-06-08 停更；当前主干见 [CURRENT_BASELINE.md](../CURRENT_BASELINE.md)。

> **模式**：只读设计，不执行代码
> **基线**：`v2-dev` @ `dc4331f`（P0-A/P0-B 后）
> **依赖**：P0-A 已建立 `hasValidContext` 守卫 + 四上下文识别
> **原则**：7 条 P1 原则（司令部 2026-06-08）
> **下一步**：本方案 + Cursor 验证 → 司令部会诊 → 执行

---

## 一、现状回顾（P0 后的入口地图 — 修正版）

> **基于 Cursor 在 `dc4331f` 的定点验证**。关键发现：设计文档原写的"13 处裸链"大部分实码已有 `from=`，核心问题不是缺 from 而是**入口路由策略错误**（不应进 WDP 的进了）和**上下文错误**（from 值与实际不匹配）。
> **全库唯一真裸链**：`ProposalDetailPage.tsx:133`。

### 合规入口（12 处 — 保留）

| 文件 | 行 | 目标 | 保留理由 |
|------|-----|------|---------|
| `PlanningInProgressPage.tsx` | 46 | `?from=planning` | 企划课进行中列 ✅ |
| `PlanningProjectsPage.tsx` | 46 | `?from=planning` | 企划课已完成列 ✅ |
| `ProposalEvalPage.tsx` | 55,148 | `?from=planning` | 企划课接收后跳转 ✅ |
| `WritingProjectsPage.tsx` | 80 | `?from=writing` | 创作室三列 ✅ |
| `WritingEditorPage.tsx` | 251,295,320 | `?from=writing` | P0-B 已修复 ✅ |
| `EditorialPage.tsx` | 81 | `?from=editorial` | 编审部 ✅ |
| `LibraryPage.tsx` | 267 | `?from=library` | 文集库 ✅ |
| `App.tsx` | 41,50,57 | redirect | 旧路由兼容，待退役 ⚠️ |

### 待治理入口（P1 目标 — 8 处）

| 文件 | 行 | 当前 | 问题类型 | 修正方向 |
|------|-----|------|---------|---------|
| `ProposalDetailPage.tsx` | 133 | **裸链** `/work/${id}` | 唯一真裸链；创意组不应进 WDP | 移除 WDP，改链企划课列表 |
| `PlanningProposal.tsx` | 97 | `?from=planning` +「查看作品」 | 有 from 但创意组不应进 WDP | 移除 WDP，改链企划课列表 |
| `dashboard.ts` | 47→71/76/81/89 | 4 组切片 → `/work/`（有 from= 但错误/绕过部门） | 违反原则 5（dashboard 不做详情入口） | 移除 WDP 直达 |
| `dashboard.ts` | 98,114,121 | 3 条动态 → `/work/`（同上） | 同上 | 改部门路由链 |
| `ShelfPage.tsx` | 67 | 固定 `?from=planning` | 上下文错误（shelved.source 混部门） | 从 source 派生 from |
| `ProjectCard.tsx` | 71,140,142 | 硬编码 `from=planning/writing` | 共享组件自决上下文 | 调用方注入 / 接口预埋 |

### 死代码（P1 不考虑）

| 文件 | 现状 | 处理建议 |
|------|------|---------|
| `CreateProjectModal.tsx` | 已有 `?from=planning`，但**无任何页面 import** | 无需修改，随三列 UI 改造时清理 |
| `KanbanBoard.tsx` | 唯一引用 ProjectCard，但**未被任何 page import** | 随 P2 三列 UI 改造时决策 |

P0-A 已确保：即使有裸链或错误上下文进入 WDP，`hasValidContext` 守卫会防止误暴露动作。但**这层保护是安全兜底，不是设计目标**。

---

## 二、P1 核心原则（司令部裁定）

### 原则 1 — WorkDetailPage 不再是全局万能入口

WDP 仅作为**五部门三列工作区的承载页**。不属于任何部门的作品不应进入 WDP。

### 原则 2 — 所有入口必须来自五部门子页

除"继续写作"强入口外，所有进入 WDP 的入口必须来自 5 个部门子页的三列工作区。

### 原则 3 — "继续写作"强入口的条件

- 仅当存在 `writing` 状态作品时可用
- 不触发状态流转
- 没有 writing 作品时显示空态或引导到创作室待创作区
- 此入口只能从 dashboard 首页位置出现

### 原则 4 — 创意组不直接进入可操作 WDP

创意组历史提案页 → 显示"查看提案/查看承接状态"
是否允许跳转到某部门工作区需单独设计。

### 原则 5 — dashboard 不做绕过部门的详情入口

dashboard = 部门入口 + 状态数量 + 提醒
不直接提供作品详情入口（"继续写作"强入口除外）

### 原则 6 — ProjectCard 不得自行决定 from

如保留进入 WDP 的能力，调用方必须显式注入部门语境。

### 原则 7 — ShelfPage 暂存池综合设计

全局管理 + 部门局部摘要，不能简单补 from。

---

## 三、9 问题回答

### Q1. 哪些现有入口保留？

| 入口 | 保留？ | 理由 |
|------|--------|------|
| `PlanningInProgressPage` + `?from=planning` | ✅ 保留 | 企划课三列工作区入口 |
| `PlanningProjectsPage` → `ProjectPickerView` + onOpen | ✅ 保留 | 企划课已完成列入口 |
| `EditorialPage` → `/editorial/:id` | ✅ 保留 | 编审部独立路由 |
| `LibraryPage` → `/library/:id` | ✅ 保留 | 文集库独立路由 |
| `WritingProjectsPage` → onOpen | ✅ 保留 | 创作室三列工作区入口 |
| `WritingEditorPage` → `?from=writing` | ✅ 保留 | P0-B 已修复的内部回退 |
| `CreateProjectModal` → `?from=planning` | ✅ 保留 | 创建后进入企划课上下文 |
| `App.tsx L41` → `?from=planning` | ⚠️ 保留但退役 | 旧路由兼容，标记为废弃 |
| `App.tsx L50/L57` → `?from=writing` | ⚠️ 保留但退役 | 同上 |

### Q2. 哪些入口移除？

| 入口 | 操作 | 替代方案 |
|------|------|---------|
| `dashboard.ts` 全部 4 处 `/work/` | ❌ 移除 | 替换为部门入口 + 计数 |
| `ProposalDetailPage.tsx` L143 "查看作品" | ❌ 移除 | 改为"查看承接状态"，跳转到 proposal 自身状态页 |
| `PlanningProposal.tsx` L150 "查看作品" | ❌ 移除 | 同上 |
| `ShelfPage.tsx` L67 裸链 | ❌ 移除 | 改为从 `shelved.source` 派生上下文 |
| `ProjectCard.tsx` L71/140/142 裸链 | ❌ 移除默认行为 | 改为调用方注入，无注入时不可点击 |

### Q3. 哪些入口改名？

已在 Q4 映射表中完成。核心变更：

| 旧文案 | 新文案 | 部门 |
|-------|--------|------|
| 查看作品（PlanningProposal） | 查看承接状态 | 创意组 |
| 查看作品（ProposalDetailPage） | 查看提案承接 | 创意组 |
| 查看作品（ProjectCard） | 按部门上下文动态 | 多部门 |
| 进入企划课（dashboard 动态） | 进入企划课 | 企划课 |
| 创作室有更新（dashboard 动态） | 继续创作 | 创作室 |
| 文集库已完成（dashboard 动态） | 查看归档作品 | 文集库 |

### Q4. 哪些入口迁移到五部门三列工作区？

**所有 P1 保留的 WDP 入口必须来自三列工作区。** 这意味着：

| 当前入口 | 目标位置 |
|---------|---------|
| PlanningInProgressPage 卡片 | 企划课·进行中列 |
| PlanningProjectsPage 卡片 | 企划课·已完成列 |
| WritingProjectsPage 卡片 | 创作室·待创作/创作中/已完成列 |
| EditorialPage 卡片 | 编审部·待审阅/审阅中/已审阅列 |
| LibraryPage 卡片 | 文集库·待归库/已完成列 |
| dashboard "继续写作" | 首页独立区域 |
| ProposalDetailPage → 不进入 WDP | 创意组提案详情页（独立设计） |

### Q5. dashboard 首页最终应长什么样？

```
┌─────────────────────────────────────────────┐
│  我的创作台                                   │
│  五段管线一览                                 │
├─────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │创意组 │ │企划课 │ │创作室 │ │编审部 │ │文集库 ││
│  │  N个  │ │  N个  │ │  N部  │ │  N待  │ │  N部  ││
│  │ 提案  │ │ 立项  │ │ 创作  │ │  审   │ │ 归档  ││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
├─────────────────────────────────────────────┤
│  继续写作                                      │
│  ┌─ 作品A ─┐ ┌─ 作品B ─┐                      │
│  │ [继续]   │ │ [继续]   │                      │
│  └─────────┘ └─────────┘                      │
│  （仅当有 writing 状态作品时显示）                │
├─────────────────────────────────────────────┤
│  提醒 / 待处理                                  │
│  • 创作室「作品X」已完成，待审阅                  │
│  • 企划课「作品Y」已接收                        │
│  • 暂存池有 N 项待处理                          │
└─────────────────────────────────────────────┘
```

**关键设计决策**：
1. 五部门卡片 → 仅展示部门名称 + 数量，点击进入对应部门子页
2. "继续写作"区域 → 仅有 `writing` 状态作品时显示，直接进入编辑器（不经过 WDP）
3. 提醒区域 → 纯文字链接到对应部门列表，不提供 WDP 直接入口
4. 移除 dashboard.ts 中的 `mapProjectItem` 生成的 `/work/${p.id}` 链接

### Q6. 创意组提案与已接收作品之间如何展示承接关系？

```
提案状态流:
  draft → submitted → approved (→ 进入企划课)
                                           ↓
                                     project.created
                                     (在企划课 WDP 中)

创意组可见的承接关系:
  "已提交"提案 → 显示"已提交，等待企划课接收"
  "已通过"提案 → 显示"已接收入企划课" + 链接到企划课工作区
  proposal.projectId 存在时 → 可提供只读"查看企划进度"（链接到规划页面而非 WDP）
```

**具体方案**：
- `ProposalDetailPage.tsx`：当 `proposal.projectId` 存在时，显示"已接收入企划课（查看进度）"，链接到 `/planning/in-progress` 或 `/planning/projects`（取决于 status），**不进入 WDP**
- `PlanningProposal.tsx`：同样改为"查看企划进度"，不再提供 `/work/:id` 链接
- 创意组不提供可操作 WDP 入口（原则 4）

### Q7. ProjectCard 如何治理？

**方案：调用方注入 `from` + 无注入时只读**

`ProjectCardProps` 新增可选字段：
```typescript
interface ProjectCardProps {
  project: Project
  // ... 现有 prop 不变
  departmentFrom?: 'planning' | 'writing' | 'editorial' | 'library'
}
```

规则：
- `departmentFrom` 存在 → 标题点击导航到 `/work/${id}?from=${departmentFrom}`
- `departmentFrom` 不存在 → 标题纯文本展示，不可点击
- 编辑器按钮同样受 `departmentFrom` 控制（仅 when from=writing 时显示）
- 调用方（各部门页面）在渲染 ProjectCard 时传入正确的 departmentFrom

**影响范围**：
- `PlanningInProgressPage` → 传 `departmentFrom="planning"`
- `WritingProjectsPage` → 传 `departmentFrom="writing"`（但 WritingProjectsPage 直接使用 ProjectCard 吗？待确认）
- `EditorialPage` → 传 `departmentFrom="editorial"`（但 EditorialPage 使用独立路由，可能不用 ProjectCard）
- `LibraryPage` → 传 `departmentFrom="library"`（同上）
- `dashboard.ts` → 不使用 ProjectCard（dashboard 不再提供详情入口）
- `ShelfPage` → 根据 `shelved.source` 动态传 departmentFrom

### Q8. ShelfPage 暂存池如何进入和恢复？

**进入**：
- 全局管理：`ShelfPage.tsx` 保留为 `/shelf` 路由，展示所有暂存项
- 部门局部：每个部门子页底部新增"暂存区"折叠区块，仅展示 `shelved.source` 匹配本部门的项

**恢复**：
- 从暂存池恢复 → 跳转到原部门的工作区（根据 `shelved.source` 映射）
  - `planning` → `/planning/in-progress`
  - `studio` → `/writing/projects`
  - `editorial` → `/editorial`
  - `library` → `/library`
- 恢复操作本身保持现有 `handleRestore` 逻辑（设置 `deletedAt = null`）

**暂存池中的作品进入 WDP**：
- ShelfPage 中每个暂存项进入 WDP 时，从 `shelved.source` 派生 `from=`
- 映射表：`planning→planning`, `studio→writing`, `editorial→editorial`, `library→library`
- 缺失时降级到 `hasValidContext=false`（P0-A 已保护）

### Q9. 第一枪代码改造建议是什么？

**基于实码校正后建议：P1-A 聚焦 dashboard + HomePage；ProjectCard 降级到 P1-C**

理由：ProjectCard 当前无活跃调用方（仅死代码 KanbanBoard），做治理无用户可见效果。

```
P1-A（dashboard + 首页）:
  dashboard.ts:
    - 移除 7 处 /work/ 生成（4 切片 + 3 动态）
    - 切片列表 → 条目改为不可点/纯标题，或链到 stage.to（部门子页）
    - 动态活动 → /work/ 链改为部门路由链
    - 新增 continueWriting 数据结构（若 D1 通过）

  HomePage.tsx:
    - 切片列表消费方适配（不再渲染 <Link to={item.href}>）
    - 若 D1=是：新增"继续写作"独立区块
    - 动态区 activity href 适配

P1-B（创意组入口）:
  ProposalDetailPage.tsx:
    - 移除 L133 "/work/" 裸链
    - 改为"查看企划进度" → 链到企划课列表（需 D3 裁定路由）

  PlanningProposal.tsx:
    - L97 "查看作品" → "查看企划进度" / "查看承接状态"
    - 目标同上

P1-C（ShelfPage + 文案）:
  ShelfPage.tsx:
    - from 从 shelved.source 派生（映射表: planning→planning, writing→writing, review→editorial, library→library, 其他→无有效 from）

  入口文案统一:
    - 全部"查看作品"改为部门化文案

📋（后续）:
  ProjectCard 接口预埋 departmentFrom prop（随 Kanban 复活或清理时一并处理）
  CreateProjectModal 死代码清理
  App.tsx 旧路由退役
```

---

## 四、关键设计决策表

| 决策项 | 选项 A | 选项 B | 推荐 |
|--------|--------|--------|------|
| dashboard 详情入口 | 全部移除 | 保留"继续写作" | **A+B**：保留继续写作，移除其他 |
| ProjectCard from 注入 | 组件 prop | 更高层 context | **组件 prop**（最小侵入） |
| 创意组→WDP | 加 from=planning | 不进入 WDP | **不进入**（原则 4） |
| 暂存池入口 from | 从 shelved.source 派生 | 固定 from=planning | **派生**（原则 7） |
| 旧路由 redirect | 立即删除 | 标记废弃保留 | **标记废弃**（前端兼容） |
| 三列 UI 改造 | P1 一起做 | P2 单独做 | **P2**（范围控制） |

---

## 五、需司令部会诊项（含实码补充证据）

### D1. "继续写作"强入口设计

是否同意在 dashboard 首页增加"继续写作"区域？交互方式：
- 卡片列表（仅限 `writing` 状态作品）
- 点击直接进入编辑器（`/writing/:id/:chapterId`），不经过 WDP

**实码证据**：HomePage 尚无该区块；dashboard.ts 中 `writingItems` 当前走 `?from=writing` 进入 WDP。若 D1=是，P1-A 必须同时改造 HomePage.tsx + dashboard.ts 数据结构。

### D2. ProjectCard 治理方向

是否同意调用方注入 `departmentFrom` prop 的方案？

**实码证据**：ProjectCard 当前**无活跃调用方**（仅死代码 KanbanBoard）。建议降级到 P1-C 或随 Kanban 命运决策，P1-A 不做。

### D3. 创意组→企划课承接

创意组已接收提案的"查看企划进度"链接目标：
- A: `/planning/in-progress`（企划课进行中列表）— 最简单
- B: `/planning/projects`（企划课已完成列表）
- C: 根据 `project.status` 动态选择 — 需额外 API 调用

**实码证据**：ProposalDetailPage 已有 `proposal.projectId`，但**不保证对应 project 的 status 已加载**。选 C 需要异步获取 project 数据，选 A 最直接。

### D4. 旧路由退役时间点

App.tsx L50/L57（`/editor/:projectId` → `/work?from=writing`、`/writing/:projectId` → `/work?from=writing`）何时删除？

**实码证据**：P0-A 后 WDP 已能正确识别 `from=writing`。删除前需确认无外链书签依赖。

### D5. P1 三枪排序

基于实码校正后的建议顺序：
1. **P1-A**: dashboard.ts + HomePage.tsx（清除 WDP 直达，可选加继续写作）
2. **P1-B**: 创意组入口（ProposalDetailPage + PlanningProposal）
3. **P1-C**: ShelfPage + 入口文案统一；ProjectCard 接口预埋

是否同意此排序？

---

## 六、参考文件

- `frontend/src/services/dashboard.ts` — 4 处裸链需移除
- `frontend/src/components/projects/ProjectCard.tsx` — 共享组件需治理
- `frontend/src/pages/creative/ProposalDetailPage.tsx` — 创意组入口需重设计
- `frontend/src/components/creative/PlanningProposal.tsx` — 同上
- `frontend/src/pages/ShelfPage.tsx` — 暂存池入口需重设计
- `frontend/src/App.tsx` — 旧路由 redirect （L41/L50/L57）
- `frontend/src/pages/HomePage.tsx` — dashboard 首页 UI
