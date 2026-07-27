# 0608-audit-work-content-model.md — Work 内容模型审计与治理方案

> **文档角色**：对 `0608-amendment-work-content-model.md` 的本地审计报告。审计 Project 字段语义、WorkDetailPage 结构、`/work/:id` 路由，输出治理顺序。
> **优先级**：P1 — 0608 Work 内容模型修正案落地的第一步。
> **状态**：Audit v1（2026-06-11，Hermes 审计产出）

---

## §1 Work / Project 边界

### 1.1 领域语义

| 概念 | 领域语义 | 技术实现名 |
|------|---------|-----------|
| **Work（作品）** | novel-writer 的核心领域对象。一部正在构思、企划、创作、审阅或归档的作品。从"作品构思中"开始存在。 | 前端：`WorkDetailPage`、`workApi`；后端：`/api/v2/work/:id` |
| **Project** | 1.0 遗留技术名。在 0608 下仅作为 Prisma model 名和兼容 API 名继续存在，不作为产品语义。 | 后端：Prisma `Project` model、`/api/v2/projects/*`；前端：`projectsApi`、`Project` 类型 |

### 1.2 当前状态

核心矛盾：**语义上已经认 Work，但技术实现上仍然全线用 Project。** 

```
前端已做：
  ✅ WorkDetailPage（组件名正确）
  ✅ workApi.getDetail(id)（方法名正确）
  ✅ /api/v2/work/:id（后端端点名正确）
  ✅ WorkDetailResponse（类型名正确）

前端未做：
  ❌ WorkDetailResponse.project 字段仍叫 project
  ❌ WorkDetailPage 内变量仍叫 project（如 const project = data?.project）
  ❌ Project 类型仍大面积用于列表页、创建、更新
  ❌ projectsApi 仍以 Project 类型为返回
  ❌ PROJECT_STATUS_LABEL 仍用 Project 命名

后端未做：
  ❌ Prisma model 仍叫 Project
  ❌ /api/v2/work/:id 返回体仍用 project 作为 key
  ❌ 后端日志/错误消息仍写 "Project not found"
```

### 1.3 边界的核心结论

> Work 是领域对象。Project 是遗留技术名。
> 作品详情页从"作品构思中"开始，不从 Project(planning) 开始。
> 当前代码中语义已部分转向 Work，但类型系统和变量名仍有大面积 Project 残留。

---

## §2 Project 字段审计表

基于 Prisma schema + 前端 `Project` interface，所有字段归类如下：

### 2.1 完整归类

| 字段 | 来源 | 当前类型 | 归类 | 说明 |
|------|------|---------|------|------|
| `id` | Prisma | String | **Work 核心** | 作品唯一标识 |
| `title` | Prisma | String | **Work 核心** | 作品标题。最高级必填。 |
| `description` | Prisma | String? | **WorkMetadata** | 当前语义混乱（有时是梗概、有时是描述）。需与 `metadata.synopsis` 合并治理。 |
| `author` | Prisma | String? | **WorkMetadata** | 作者名 |
| `coverImage` | Prisma | String? | **WorkMetadata** | 封面图 |
| `status` | Prisma | String | ⚡ **FlowState** | 流程状态。不属于作品内容。 |
| `submittedToPlanningAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `greenlitAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `writingStartedAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `workCompletedAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `submittedToReviewAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `archivedAt` | Prisma | DateTime? | ⚡ **FlowState** | 流程时间戳 |
| `deletedAt` | Prisma | DateTime? | ⚡ **FlowState** | 软删除标记。流程元层标记。 |
| `writingStyle` | Prisma | String? | **WorkMetadata** | 写作风格 |
| `wordCount` | Prisma | Int | **统计字段** | 计算值，不属于内容核心 |
| `metadata` | Prisma | Json? | **WorkMetadata** | 混合字段。当前承载 synopsis/outline 等语义。需要拆解。 |
| `masterPrompt` | Prisma | String? | 🔴 **Legacy/Frozen** | AI 遗留。不进入 0608 内容模型。 |
| `tags` | Prisma | Json? | **WorkMetadata** | 题材标签 |
| `collectionId` | Prisma | String? | **WorkMetadata** | 文集归属 |
| `proposalId` | Prisma | String? | **Work 关联** | 关联源 Proposal |
| `createdAt` | Prisma | DateTime | **Work 核心** | 创建时间 |
| `updatedAt` | Prisma | DateTime | **Work 核心** | 更新时间 |
| `genre` | 前端 | string[] | 🔴 **删除候选** | 前端 `api.ts` L143 存在但与 `tags` 重复（L453: `genre: p.tags`） |
| `chapterCount` | 前端 | number? | **统计字段** | 前端计算值 |

### 2.2 Chapter 字段归类

| 字段 | 归类 | 说明 |
|------|------|------|
| `id` | **WorkChapter** | 章节唯一标识 |
| `title` | **WorkChapter** | 章节名。最低必填。 |
| `order` | **WorkChapter** | 第几章。最低必填。 |
| `content` | **WorkBody** | 章节正文。最自由编辑层。 |
| `summary` | **WorkChapter** | 章节梗概。最低必填。 |
| `status` | ⚡ Chapter FlowState | 章级状态，不等于 Work 流程状态 |
| `wordCount` | **统计字段** | 计算值 |
| `metadata` | **WorkChapter** 备选 | 可承载章节备注、出场人物等选填字段 |

### 2.3 归总

```
Work 核心字段:    id, title, createdAt, updatedAt
WorkMetadata:     description, author, coverImage, writingStyle, metadata, tags, collectionId
WorkChapter:      Chapter.title, Chapter.order, Chapter.summary
WorkBody:         Chapter.content
FlowState:        status, 7 timestamps, deletedAt
统计字段:         wordCount, chapterCount
Legacy/Frozen:    masterPrompt
删除候选:         genre (前端重复)
```

---

## §3 WorkDetailPage 当前问题

### 3.1 现状

当前 WorkDetailPage 定义了三个 Tab：

```typescript
type WorkTab = 'setting' | 'chapters' | 'metadata'
// setting → WorldBuildingPage   ← 角色/时间线/创意心流（不是"作品设定"）
// chapters → 章节列表            ← 标题+字数，梗概藏在按钮后
// metadata → ContentMetadataCard ← AI 提取的元数据
```

### 3.2 与修正案的三分法对照

| 修正案要求 | 当前实现 | 差距 |
|-----------|---------|------|
| **作品元数据**：标题+梗概（必填）、主题、冲突、风格等 | 藏在 Tab "元数据"中，仅显示 AI 提取字段。标题在页面顶部，梗概没有独立展示区。 | 标题和梗概不是同一区域的必填字段。元数据是"AI 提取的"而非"作者设定的"。 |
| **作品章节**：第几章+章节名+章节梗概（必填） | Tab "章节列表"有章节名和字数，梗概需点按钮弹出 modal 查看。无法一眼看到所有章节的梗概。 | 章节梗概不是内联可见的，不符合"最低必填字段"要求。 |
| **作品正文**：可编辑、可删除、可重写 | 没有独立的"正文"Tab。正文藏在 WritingEditorPage 中，不是 WorkDetailPage 的一部分。 | WorkDetailPage 缺少正文视图。创作室点击"继续写作"跳到另一个页面。 |

### 3.3 具体问题清单

| # | 问题 | 严重度 |
|---|------|:---:|
| P1 | 三个 Tab 与修正案三部分不对应：setting=角色（非元数据）、metadata=AI提取（非作者元数据）、正文缺失 | 🔴 |
| P2 | `setting` → WorldBuildingPage 承载角色/时间线/创意心流——这些是**创作工具**，不是"作品设定" | 🔴 |
| P3 | 章节梗概 (`Chapter.summary`) 藏在 modal 里，不在列表上直接可见 | 🟡 |
| P4 | WorkDetailPage 没有作品正文区域。正文只在 WritingEditorPage | 🟡 |
| P5 | 标题 (`Project.title`) 在顶部栏显示，梗概没有主展示位 | 🟡 |
| P6 | `ContentMetadataCard` 是为 AI 提取设计的，不是为作者手动填写的元数据面板 | 🟡 |
| P7 | 变量名全页用 `project`（`const project = data?.project`），不符合 Work 语义 | 🟡 |

---

## §4 `/work/:id` 与 Project API 的分裂情况

### 4.1 两条线的现状

```
线 A: /api/v2/work/:id    ← 后端 workRoutes，前端 workApi.getDetail(id)
       返回: { project: Project, chapters, characters, timelineEntries, creativeFlows, proposal }
       用途: WorkDetailPage 加载

线 B: /api/v2/projects/*   ← 后端 projectRoutes，前端 projectsApi.*
       用途: 所有 CRUD、列表、状态转换、导入导出、metadata
```

### 4.2 分裂点

| 维度 | 线 A (work) | 线 B (projects) | 分裂？ |
|------|-----------|----------------|:---:|
| 路由前缀 | `/api/v2/work/:id` | `/api/v2/projects/*` | ✅ 是 |
| 返回 key | `{ project: {...}, chapters, ... }` | `{ success, data: {...} }` | ✅ 是 |
| 前端类型 | `WorkDetailResponse` | `Project` | ✅ 是 |
| 前端调用方 | `workApi.getDetail(id)` | `projectsApi.*` | ✅ 是 |
| 数据源 | 同一个 Prisma `Project` 表 | 同一个 Prisma `Project` 表 | ✅ 无 |
| 后端代码 | `workRoutes`（58 行） | `projectRoutes`（1089 行） | ✅ 是 |

### 4.3 评估

两条线的好处是 WorkDetailPage 已经有独立的语义入口（`/api/v2/work/:id`），不需要混合在 Project CRUD 中。坏处是：

- WorkDetailPage 加载后如果要更新，依然调 `projectsApi.update()`
- `WorkDetailResponse.project` 和 `Project` 是同类型但分裂成两个名字
- 后端 `workRoutes` 太薄（只一个 GET），其余操作全在 `projectRoutes`

### 4.4 治理建议

**短期**：两条线保持独立。`workApi` 继续做详情聚合，`projectsApi` 继续做 CRUD。不合并。
**中期**：`WorkDetailResponse` 中 `project` 字段重命名为 `work`（或加 alias）；前端变量名从 `project` 改为 `work`。
**长期**：评估是否将 `projectsApi` 迁移为 `worksApi` wrapper。

---

## §5 已修改的本地文档

本审计报告为新增文档：`docs/design/0608-constitutional-guidance/0608-audit-work-content-model.md`

后续需更新 README.md 索引。

---

## §6 本地治理顺序

### P0 — 文档语义冻结（本轮）

```
□ 0608 设计文档全部改用 Work / 作品（已在进行中）
□ 0608-audit-work-content-model.md（本文件）作为审计基线
□ README.md 索引更新
```

### P1 — WorkDetailPage 结构调整（下一轮设计讨论）

```
□ 重新定义 WorkDetailPage 的三部分结构：
    作品元数据（标题+梗概必填 + 选填字段面板）
    作品章节（章节名+梗概内联可见）
    作品正文（嵌入或链接到 WritingEditorPage）

□ 当前 Tab 重组：
    'setting' 角色/时间线 → 移出 WorkDetailPage
    'metadata' → 合并入"作品元数据"
    'chapters' → 保留但梗概内联

□ 标题和梗概提升为页面顶部固定区域（非 Tab 内容）
```

### P2 — 前端别名层

```
□ 新增 type Work = Project（或 adapter）
□ WorkDetailPage 内变量 project → work
□ WorkDetailResponse.project → .work
□ PROJECT_STATUS_LABEL → 保留但文档中标注 Legacy
```

### P3 — API 兼容层

```
□ projectsApi 保留不动
□ 可选：新增 worksApi 作为 projectsApi 的语义 wrapper
□ 后端 workRoutes 保留独立
```

### P4 — 数据库迁移评估（远期）

```
□ 仅在功能稳定后评估 Prisma Project → Work 重命名
```

---

## §7 仍需确认的问题

| # | 问题 | 说明 |
|---|------|------|
| Q1 | **WorkDetailPage 三分法的 Tab 重组方案** | 当前 setting/chapters/metadata 三 Tab 需要重组为 作品元数据/作品章节/作品正文。角色/时间线等"创作工具"是否移出 WorkDetailPage 到独立页面？ |
| Q2 | **作品正文在 WorkDetailPage 中的形态** | 正文应该是内联可编辑区还是跳转到 WritingEditorPage 的入口？ |
| Q3 | **`description` vs `metadata.synopsis` 合并** | 当前有两个字段承载梗概。合并策略：以哪个为准？是否需要在 Prisma 层面迁一？ |
| Q4 | **`PROJECT_STATUS_LABEL` 全局字典迁移时机** | F-006 已冻结，但 `getStatusLabel` 仍在 `api.ts` L96 导出并被多处引用。何时替换为 `getProjectStatusLabel(status, phase)`？ |
| Q5 | **前端 `genre` 字段删除** | `api.ts` L143 `genre?: string[]` 与 `tags` 完全重复（L453: `genre: p.tags`）。可以安全删除。 |

---

## §8 确认未涉及 AI / Agent / VPS

本轮审计仅涉及本地 novel-writer 项目的 Prisma schema、前端类型系统和 WorkDetailPage 代码结构。未修改或引用任何 AI 路由、Hermes Agent、VPS 部署相关代码或文档。

---

## §9 记录

| 时间 | 事件 |
|------|------|
| 2026-06-11 | Audit v1。基于 `0608-amendment-work-content-model.md` 审计 Project 字段、WorkDetailPage 结构、`/work/:id` 路由分裂。输出字段归类表和治理顺序。 |
