# 入口交互治理方案 — 修正版审计 + 设计方案

> **模式**：只读分析，不修改代码
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **前置审计**：TASK-entry-semantic-audit.md（第一轮）+ Cursor 报告（已纠正事实错误）
> **编制**：前线指挥部（Claude），基于真实 HEAD 代码逐条核实

---

## 🔑 关键架构发现

在逐条核实前，先揭示一个**架构级问题**：

### badgePhase 回落仅为二元判断

`WorkDetailPage.tsx` L127-129：
```typescript
const from = searchParams.get('from')
const isPlanningContext = from === 'planning'
const badgePhase: PhaseContext = isPlanningContext ? 'planning' : 'studio'
```

**当前实现**：
- `from=planning` → badgePhase=`planning`
- **其他所有情况**（`from=writing`、`from=editorial`、`from=library`、无 `from=`）→ badgePhase=`studio`

这意味着：即使入口正确携带了 `?from=writing` 或 `?from=library`，WorkDetailPage **也不会识别这些上下文**，所有非 planning 的入口都退化为 `studio` 模式。

**这是 0608 设计体系中未完成的遗留问题**——四上下文守卫（isPlanningContext/isWritingContext/isEditorialContext/isLibraryContext）仅 isPlanningContext 已实现，其余三个尚未落地。

---

## A. 修正版入口审计表

### 图例

| 标记 | 含义 |
|------|------|
| 🔴 裸链 | 无 `from=` ，WorkDetailPage 无部门上下文 |
| 🟠 上下文无效 | 有 `from=` 但 WorkDetailPage 不识别该上下文 |
| 🟡 设计缺口 | 入口文案/位置不符合 0608 语义 |
| ✅ 合规 | 上下文 + 路由 + 文案均符合 0608 |
| ⚪ 共享组件 | 调用方多部门，需治理方案 |

### 总览

| 文件 | 行号 | 入口文案 | 来源 | 目标 | from 参数 | Vaild? | 风险 | 类型 |
|------|------|---------|------|------|-----------|--------|------|------|
| `ProposalDetailPage.tsx` | 143 | 查看作品 | 创意组 | `/work/${projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `PlanningProposal.tsx` | 150 | 查看作品 | 创意组 | `/work/${projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `dashboard.ts` | 60 | 标题链接 | 全局/主页 | `/work/${p.id}` | **无** | ❌ | 🔴 | 裸链 |
| `dashboard.ts` | 112 | 已通过→进入企划课 | 主页/最近动态 | `/work/${p.projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `dashboard.ts` | 128 | 创作室有更新 | 主页/最近动态 | `/work/${p.id}` | **无** | ❌ | 🔴 | 裸链 |
| `dashboard.ts` | 135 | 文集库已完成 | 主页/最近动态 | `/work/${p.id}` | **无** | ❌ | 🔴 | 裸链 |
| `ProjectCard.tsx` | 71 | 查看作品详情 | **共享组件** | `/work/${project.id}` | **无** | ❌ | 🔴 | 裸链+共享 |
| `ProjectCard.tsx` | 140 | 进入编辑器→无章节回退 | **共享组件** | `/work/${project.id}` | **无** | ❌ | 🔴 | 裸链+共享 |
| `ProjectCard.tsx` | 142 | 进入编辑器→失败回退 | **共享组件** | `/work/${project.id}` | **无** | ❌ | 🔴 | 裸链+共享 |
| `ShelfPage.tsx` | 67 | 作品卡片（暂存池） | 全局/暂存池 | `/work/${project.id}` | **无** | ❌ | 🔴 | 裸链+混合 |
| `WritingEditorPage.tsx` | 250 | handleGoBack | 创作室 | `/work/${projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `WritingEditorPage.tsx` | 294 | 错误态回退按钮 | 创作室 | `/work/${projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `WritingEditorPage.tsx` | 319 | 无章节回退按钮 | 创作室 | `/work/${projectId}` | **无** | ❌ | 🔴 | 裸链 |
| `CreateProjectModal.tsx` | 68 | 创建完成自动跳转 | 企划课 | `/work/${newProject.id}` | **无** | ❌ | 🔴 | 裸链 |
| `App.tsx` | 41 | 已接收→redirect | 全局/旧路由 | `/work/${id}?from=planning` | planning | ✅ | 🟠 | 上下文有效但 WorkDetailPage 仅识别 planning |
| `App.tsx` | 50 | editor→redirect | 全局/旧路由 | `/work/${projectId}?from=writing` | writing | ❌ | 🔴 | **WorkDetailPage 不识别 writing** |
| `App.tsx` | 57 | writing→redirect | 全局/旧路由 | `/work/${projectId}?from=writing` | writing | ❌ | 🔴 | **同上** |
| `PlanningInProgressPage.tsx` | 46 | 卡片点击（企划进行中） | 企划课 | `/work/${id}?from=planning` | planning | ✅ | ✅ | 合规 |
| `EditorialPage.tsx` | 45 | 卡片点击（审阅） | 编审部 | `/editorial/${projectId}` | 独立路由 | ✅ | ✅ | 独立路由，非 `/work/` |
| `LibraryPage.tsx` | 203 | 卡片点击（归档） | 文集库 | `/library/${projectId}` | 独立路由 | ✅ | ✅ | 独立路由，非 `/work/` |

### 汇总统计

```
类型分布：
  🔴 裸链（完全无 from=）:   14 处
  🔴 上下文无效（from=但 WorkDetailPage 不识别）: 2 处（writing from）
  ✅ 合规（from=planning 且 WorkDetailPage 识别）:  1 处（+ 1 处 App.tsx redirect）
  ✅ 独立路由（非 /work/）: 2 处（editorial, library）

风险分布：
  🔴 高（立即修复）:  16 处（14 裸链 + 2 writing-from 无效）
  🟠 中（依赖架构修复）: 0 处
  ✅ 合规:  4 处（2 from=planning + 2 独立路由）

按来源：
  创意组:    2 处（ProposalDetailPage, PlanningProposal）— 全部裸链
  企划课:    2 处（PlanningInProgressPage ✅, CreateProjectModal 🔴）
  创作室:    3 处（WritingEditorPage ×3）— 全部裸链
  编审部:    0 处（走独立路由 ✅）
  文集库:    0 处（走独立路由 ✅）
  共享组件:  3 处（ProjectCard ×3）— 全部裸链
  全局/主页: 5 处（dashboard ×4, ShelfPage ×1）— 全部裸链
  旧路由:    3 处（App.tsx L41/50/57）— 有 from= 但仅 1 处有效
```

### 与 Cursor 报告对比

| 指标 | Cursor 报告 | 修正版 |
|------|-----------|--------|
| 裸链（无 from=） | 约 5 处 | **14 处** |
| 上下文无效 | 标注为合规 | **识别出 writing-from 无效** |
| badgePhase 架构问题 | 未提及 | **识别为 P0 架构问题** |
| 高风险入口 | 1 🔴 | **16 🔴** |
| 合规入口 | 16 ✅ | 4 ✅ |

---

## B. 设计建议（保留 Cursor 可用的思路）

以下保留 Cursor 报告中方向正确的设计建议，但不引用其审计表数据。

### Q1. 入口分类体系 ✅ 可用
按部门/路由模式/交互模式三维分类。详见 Cursor 原文 §B.1。

### Q2. 独立路由 vs `?from=` ✅ 可用
判断标准正确：交互显著分叉时走独立路由（editorial/library 已实现），统一组件时走 `?from=`。详见 §B.2。

### Q3. ProjectCard 共享组件治理 ✅ 可用
调用方注入 `from` 上下文，组件内部不硬编码。详见 §B.3。

### Q4. 入口文案映射表 ✅ 可用
5 部门 × 3 列文案建议方向正确。详见 §B.4。

### Q5. badgePhase 兜底 ⚠️ 需修正
方案 D（sessionStorage 缓存）+ B（通用视图降级）方向正确，但 A（status→phase）的 reviewed 二义性分析准确。**需补充**：当前架构中 badgePhase 只识别 planning 是比兜底更急的 P0 问题。

### Q6-Q10 ⚠️ 需基于修正数据重新调整执行计划
P0 范围应更大（16 处而非 1 处），P1/P2 工作量需重估。

---

## C. 补充评估（Q11-Q16）

### Q11. 当前主页 UI 是否仍有旧入口问题？

**是，严重**。

`HomePage.tsx` 的五部门卡片是导航入口（到 planing/projects、writing/projects、/editorial、/library 等），本身合规。但 **展开的下级列表**（`div.section` 内的 `<Link to={item.href}>`）全部走 `dashboard.ts` 生成的裸链。

`dashboard.ts` 的 `mapProjectItem`（L47-49）生成的 `href` 全部为裸 `/work/${p.id}`，无任何 `from=`。这意味着：
- 主页"最近动态"区所有作品链接全部是裸链 🔴
- 主页各部门展开列表的条目全部是裸链 🔴

### Q12. 各部门子页是否符合三列工作区？

| 部门 | 主页面 | 布局类型 | 三列状态 |
|------|--------|---------|---------|
| 创意组 | `CreativePage.tsx` | **5 Tab 布局**（非三列） | ❌ 不是三列 |
| 企划课 | `PlanningInProgressPage` + `PlanningProjectsPage` | 两页面分离 | ❌ 拆分页面非三列 |
| 创作室 | `WritingProjectsPage.tsx` | 单列表（StudioSection 区域） | 🔶 有分区雏形但不是三列 |
| 编审部 | `EditorialPage.tsx` | 单网格列表 | ❌ 非三列 |
| 文集库 | `LibraryPage.tsx` | 单列表 + 文集过滤 | ❌ 非三列 |

### Q13. 哪些子页已有三列雏形，哪些仍是旧列表？

**有雏形者**：
- **创作室 `WritingProjectsPage.tsx`**：通过 `StudioSection` 组件+ `onOpen` 回调分组渲染，可较容易改造为三列（待创作/创作中/已完成）。
- **企划课**：通过 `PlanningInProgressPage` + `PlanningProjectsPage` 两页面分离，在路由层面做了区隔（`planning` vs `planned`），但未在 UI 层面整合为三列。

**仍是旧列表者**：
- **创意组**：`CreativePage.tsx` 的 4/5 Tab 各自独立（灵感手记/外来参考/创意讨论/企划建议书），属于按功能分区而非按工作流分区。
- **编审部**：`EditorialPage.tsx` 用 `projects.filter()` 合并显示 `written`+`reviewing` 在一个网格内，未区分待审阅/审阅中。
- **文集库**：`LibraryPage.tsx` 用文集过滤代替工作流状态。

### Q14. 暂存池位置决策（A/B/C）

**建议：方案 B + C 混合**

**方案评估**：
- **A（全局暂存池 + 各部门无局部暂存池）**：当前 `ShelfPage.tsx` 即是此模式。问题是用户必须离开当前部门去全局暂存页，无法在部门上下文中感知暂存。
- **B（各部门局部暂存池）**：更符合"五部门三工作区"原则，用户可在部门页面看到"本部门暂存"的内容。但需要一个统一的管理入口。
- **C（混合）**：各部门局部摘要 + 全局管理页面。

**推荐 C**：
- 保留 `ShelfPage.tsx` 作为全局暂存管理入口
- 在每个部门子页底部增加"暂存区"局部摘要（仅展示本部门的暂存项，点击可展开/收起）
- 暂存项来源字段（`shelved.source`）已存在，可实现按部门过滤

### Q15. 第一阶段范围

**同意：第一阶段只做 UI 信息架构设计，不实现暂存池后端。**

可做：
- 入口加 `from=`（前端只改字符串/参数，不涉及后端）
- 入口文案改名（前端只改文案）
- WorkDetailPage 上下文守卫补全（isWritingContext/isEditorialContext/isLibraryContext — 只读不修改）
- 三列工作区布局重组（现有数据已按 status 过滤，只需在前端重新排列）

需后端支持：
- 暂存池的后端端点（当前 `getShelved()` 已存在，但按部门过滤需要扩展）
- 放行协议端点（release-to-*）

依赖关系：
- 入口治理（P0）不依赖后端
- 三列工作区 UI 改造（P1）不依赖后端
- 暂存池局部摘要（P2）需确认 `shelved.source` 字段覆盖度
- 放行协议（📋）需新端点

### Q16. 暂存池与 `deletedAt` / `ShelfPage` / `shelved` 的关系

| 机制 | 文件/位置 | 本质 | 与新暂存池的关系 |
|------|----------|------|----------------|
| `deletedAt` | 后端元标记 | 软删标记，可恢复 | **暂存池的底层机制**：暂存 = 设置 deletedAt + 记录来源 |
| `ShelfPage.tsx` | 前端页面 | 全局暂存管理列表 | **保留为全局管理入口**，新增各部门局部摘要 |
| `shelved` status | 旧状态字面量（1.0 遗留） | 1.0 状态机残留 | **应逐步淘汰**，新暂存不改变 status，只设置 deletedAt |
| `getShelved()` | 后端 API | 拉取所有暂存作品 | **扩展**：增加 `?source=planning|studio|editorial|library` 过滤 |
| `ShelvedMeta.source` | ShelfPage 已有字段 | 记录暂存来源部门 | **核心复用字段**：`source` → `from` 映射的基础 |

**建议**：
1. 新暂存池 = `deletedAt` 不为空 + `ShelvedMeta.source` 记录来源
2. 保留 `shelved` 作为展示标签但不再用于判断
3. `ShelfPage` 保留为全局页，各部门新增局部摘要
4. 逐步废弃 1.0 `shelved` 状态字面量（后端兼容，前端不再主动写入）

---

## D. 需司令部会诊项

### D1. WorkDetailPage 上下文守卫补全（P0）

当前 badgePhase 仅识别 `from=planning`。是否同意以下设计？

```typescript
const from = searchParams.get('from')
const isPlanningContext = from === 'planning'
const isWritingContext = from === 'writing'
const isEditorialContext = from === 'editorial'
const isLibraryContext = from === 'library'

const badgePhase: PhaseContext =
  isPlanningContext ? 'planning' :
  isWritingContext ? 'studio' :
  isEditorialContext ? 'editorial' :
  isLibraryContext ? 'library' :
  'studio' // fallback
```

### D2. 裸链统一补 `from=`（P0 执行范围）

是否同意对以下 14 处裸链逐条加 `from=`？
- `ProposalDetailPage.tsx` → `?from=planning`（创意组 → 企划课视角）
- `PlanningProposal.tsx` → `?from=planning`
- `dashboard.ts` 4 处 → 按来源动态计算 from
- `ProjectCard.tsx` 3 处 → 调用方注入
- `ShelfPage.tsx` 1 处 → 从 `shelved.source` 派生
- `WritingEditorPage.tsx` 3 处 → `?from=writing`
- `CreateProjectModal.tsx` 1 处 → `?from=planning`

### D3. ProjectCard 注入方式

调用方注入 `from` 还是更高层的 context object？

### D4. App.tsx 旧路由 redirect

L50/L57 使用 `?from=writing`，在当前架构下 WorkDetailPage 不识别。加 from 的同时是否需要同时处理 WorkDetailPage 上下文？

### D5. 暂存池方案确认

方案 C（全局管理 + 部门局部摘要）是否同意？

### D6. 第一阶段范围确认

是否同意第一阶段仅做 UI 信息架构 + 入口补 from=，暂存池后端和后端改造延后？

---

## E. 司令部批准执行方案（2026-06-08 裁定）

### P0-A：WorkDetailPage 上下文识别补全（立即执行）

**目标**：WorkDetailPage.tsx 最小修复，补全四上下文守卫。

**范围**：
- 识别 `from=planning` → `isPlanningContext`, `badgePhase='planning'`
- 识别 `from=writing` → `isWritingContext`, `badgePhase='studio'`
- 识别 `from=editorial` → `isEditorialContext`, `badgePhase='editorial'`
- 识别 `from=library` → `isLibraryContext`, `badgePhase='library'`
- 无 `from=` 时：**不默认暴露 studio 动作**（如无法做通用视图，明确列为 P0-B 风险）

**约束**：
- ❌ 不改动任何入口（不补 from=，不改文案）
- ✅ 仅改 WorkDetailPage.tsx
- ✅ 命名清晰，四守卫独立

### P0-B：内部回退类裸链修复（立即执行）

**范围（仅允许修以下 5 处）**：
| 文件 | 行号 | 原目标 | 改为 |
|------|------|--------|------|
| `WritingEditorPage.tsx` | 250 | 裸 `/work/${projectId}` | `?from=writing` |
| `WritingEditorPage.tsx` | 294 | 同上 | `?from=writing` |
| `WritingEditorPage.tsx` | 319 | 同上 | `?from=writing` |
| `CreateProjectModal.tsx` | 68 | 裸 `/work/${newProject.id}` | `?from=planning` |
| `App.tsx` | 50/57 | 已有 `from=writing` | P0-A 后确认有效 |

**不在此阶段修复（属 P1 入口架构治理）**：
- `ProposalDetailPage.tsx` — 创意组历史提案是否应进 WorkDetail？
- `PlanningProposal.tsx` — 同上
- `dashboard.ts` — 是否只做部门入口和统计？
- `ShelfPage.tsx` — 暂存池入口策略
- `ProjectCard.tsx` — 调用方注入设计

### P1：入口架构治理（单独设计阶段）

需设计的问题：
1. **创意组入口**：历史提案是否允许进入 WorkDetailPage？还是应走提案详情页？
2. **dashboard 定位**：是否只做部门入口和统计展示，不做作品详情直接入口？
3. **ProjectCard 治理**：调用方注入上下文 vs 组件内动态选择？
4. **ShelfPage 暂存池**：全局管理 + 各部门局部摘要？
5. **入口文案标准化**："查看作品"改名/移除计划

### P2：五部门三列 UI + 暂存池（P0/P1 后再设计）

1. 每部门子页统一为三列工作区
2. 各部门局部暂存池摘要
3. 入口语义对齐

---

## F. 设计建议（来自 Cursor，方向正确）

以下保留 Cursor 报告中方向正确的设计建议，但引用时已剔除其错误审计数据。

### 入口文案映射表（Q4 建议）

| 部门 | 列 | 建议文案 |
|------|-----|---------|
| 创意组 | 待处理 | 查看提案 |
| 创意组 | 进行中 | 评估进度 |
| 创意组 | 已完成 | 查看入企划作品 |
| 企划课 | 待处理 | 进入企划设定 |
| 企划课 | 进行中 | 管理章节规划 |
| 企划课 | 已完成 | 进入创作 |
| 创作室 | 待创作 | 进入创作室 |
| 创作室 | 创作中 | 继续创作 |
| 创作室 | 已完成 | 查看已创作作品 |
| 编审部 | 待审阅 | 进入审阅 |
| 编审部 | 审阅中 | 继续审阅 |
| 编审部 | 已审阅 | 查看审阅报告 |
| 文集库 | 待归库 | 归入文集 |
| 文集库 | 已完成 | 查看已归档作品 |

### badgePhase 兜底策略（Q5 建议）

推荐 **D + B** 组合：
- **D**: 进入 `/work/:id` 且带 `from=` 时，`{workId: from}` 缓存到 `sessionStorage`
- **B**: 缓存也缺失时，显示通用视图（精简动作，无部门特定 badge）
- 不推荐 A（status→phase）：`reviewed` 在编审部和文集库语义不同，仅靠 status 无法区分

---

*本报告基于真实 HEAD 代码 `2e0e7a7` 逐条核实，全部 `/work/` 入口已覆盖。*
