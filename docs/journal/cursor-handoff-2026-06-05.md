# 2026-06-05 Cursor 会合：L1 收口 + 编审部/文集库中等骨架

> 用法：发卡给 Cursor 的第一句。Cursor 应在读完后从 TASK-240 开始起草正文。
> **权威设计**：`docs/design/overall-architecture.md` v4.1.1（VPS `v2-dev` `b579fb0` 为准，勿用本机草稿）
> **第 0 步（起草前）**：`docs/design/day1-handoff-brief.md`（5 分钟入门）
> **部门专题**：`editorial-dept-v2.md`（编审部）/ `editorial-library-v2.md`（文集库）

---

## 项目状态（截至 2026-06-05）

**Novel Writer 2.0+** —— 一个人的小说创作器，5 个身份 = 5 部门。VPS `v2-dev` 分支，`ecec09a` 起步，`b579fb0` v4.1.1 微修订入库（**未 push**）。

**已交付**：
- 创意组 4 Tab（设计 5 Tab，**VPS 缺 AI 搜索 tab 待补**；TASK-011~102 共 12 卡 2026-06-02 完成）
- M1-A 端点骨架：13 端点 + 9 primary 字面量 + 7 时间戳 + `writingStyle` 顶层 + `deletedAt` 软删

**待搭（你接下来 6 张卡）**：

| # | 卡号 | 范围 |
|---|------|------|
| 1 | **TASK-240** | 编审部 L1 + L2 主视图（审阅任务列表）|
| 2 | **TASK-241** | 编审部 L2 详情页（章节列表 + AI 报告占位）|
| 3 | **TASK-242** | 编审部文件暂存按钮 + 与 M1-A 端点对接 |
| 4 | **TASK-243** | 文集库 L1 + L2 主视图（作品陈列 + Collection 卡片）|
| 5 | **TASK-244** | 文集库 L2 详情页（作品详情 + 书评板块占位）|
| 6 | **TASK-245** | 文集库文件暂存按钮 + Collection 基础 CRUD |

---

## 关键约束（起草前必内化，违反要回炉）

### 1. 5 部门 L1 平铺（**最高原则**）
- 编审部 / 文集库 = 独立 L1，**不**降级为侧栏/面板/抽屉/子页
- L1 ≠ status 桶；L1 = 5 段提交动作串联（边界 = 4 个三选一节点）
- 锚点：`memory/project_l1_submission_boundary.md`（2026-06-05 用户拍板）

### 2. 9 字面量（Project.status，不变量）
```
imported / planning / planned / writing / written / reviewing / reviewed / archived
                                                  ↑            ↑
                                              TASK-240~242   TASK-243~245
```
- **不**新增字面量
- 旧 `draft` / `completed` = legacy read（存量映射，M1-A 已处理）
- **Day 2 方案 C** 移除 `shelved`（与软删机制重复，详见 `file-staging-v2.md`）

### 3. 文件暂存（软删 only）
- M3 `/shelf` → `/graveyard`（M3 实现，**这次卡内 UI 占位即可**）
- 触发按钮文案："📂 放入文件暂存"
- 弹窗文案："放入文件暂存？此作品将进入文件暂存，可随时恢复。"
- 端点：复用 M1-A `POST /projects/:id/soft-delete` + `POST /projects/:id/restore`
- `archived` Project 软删后 restore 仍为 `archived`（不回流到 `reviewing`）

### 4. AI 集成（**Day 3 议题，不在这次卡内**）
- 4 组件正交（用户 2026-06-05 重新定义）：
  - **AI 搜索** = 独立 L2 tab（最简 chat，无 prompt）
  - **AI 创意合伙人** = 创意讨论页内联（需 prompt）
  - **AI 写作助手** = 编辑器侧栏（需内容元数据）
  - **AI 审查官** = 3 阶段（企划课 / **编审部** / **文集库书评**）
- 6 张卡内 AI 部分**只做占位 UI**（按钮可见、点击不报错、AI 调用留 TODO）
- 锚点：`memory/project_ai_agents_v2.md`

### 5. 不要沿用 1.0 设计（**明确禁止**）
- 1.0 章节审阅已废 → 2.0+ 编审部 = 全文 AI 审查（**不**重建章节级审阅状态机）
- 1.0 公开博客已废 → 2.0+ 文集库 = 纯私人归档（**不**对外发布）
- 1.0 分类树已废 → 2.0+ Collection = 扁平分组（**不**层级化）
- Chapter.status = `draft / written` 两态（**不**加 `polishing` 之类）

### 6. VPS 路径命名（参考 `day1-vps-code-index.md`）
- 作品详情页 = `WorkDetailPage.tsx`（**不**是 ProjectDetailPage）
- 编辑器 = `WritingEditorPage.tsx`
- 旧 `/shelf` 路由 = `ShelfPage.tsx`（M3 改 `/graveyard`）
- Layout.tsx = 5 阶段 L1 入口（**待 TASK-240/243 加 2 个 L1**）

---

## 起草协议（按你之前同意的 draft + review 模式）

### 任务卡正文必含字段
- 目标 / in-scope / out-of-scope / 关联冲突点 / 具体改动 / 依赖前置 / 验证清单 / 预估行数 / 不变量验证 / 回滚方案

### 起草阶段禁止
- ❌ 不要 push
- ❌ 不要跑 `prisma migrate dev`
- ❌ 不要触碰 out-of-scope 文件

### 流程
1. 你起草 1 张 → 用户 paste 给 Claude 出审稿意见 → 你修订 → 下 1 张
2. **不**一次 review 6 张（颗粒度比一次性 review 更细）
3. 静态核对维度：18 不变量 + 6 张卡边界 + VPS 文件名一致性 + 依赖顺序 + 端点命名去歧义 + out-of-scope 文件清单

### 优先级
- TASK-240 先出 → Claude 静态核对 → OK 后 TASK-241 → 串行
- 6 张全部 OK 后，**整体合并 commit**（用户偏好阶段性批量提交，**不**每卡一 commit）

---

## 第一步

读 `docs/design/day1-handoff-brief.md`（5 分钟），然后从 **TASK-240** 开始起草正文。起草完后 paste 给用户，由用户转 Claude 出审稿意见。

---

## 附：每张卡的快速范围说明

### TASK-240 编审部 L1 + L2 主视图
- **目标**：让用户能从 L1 入口看到所有待审阅作品（status=`written` 或 `reviewing`）
- **in-scope**：`Layout.tsx` 加"编审部" L1 tab；新建 `EditorialPage.tsx`；路由 `/editorial`；列表项显示作品名/作者（自己）/待审章节数/状态
- **out-of-scope**：详情页（TASK-241）/ 文件暂存按钮（TASK-242）/ AI 审阅报告（TASK-241 占位）/ 评分卡

### TASK-241 编审部 L2 详情页
- **目标**：进入单部作品的审阅工作台
- **in-scope**：`ReviewDetailPage.tsx`；路由 `/editorial/:projectId`；左侧章节列表（只读，点击切换）；右侧 AI 审阅报告面板（**占位**：标题 + "AI 审查（Day 3 接入）"提示 + 5 维空卡）；底部"标记已审 / 生成报告"按钮占位
- **out-of-scope**：AI 实际调用 / 评分卡 / 报告导出

### TASK-242 编审部文件暂存按钮 + 端点对接
- **目标**：编审部视角也能软删（与文集团/创作室/企划课一致）
- **in-scope**：`ReviewDetailPage.tsx` 加"📂 放入文件暂存"按钮（同 `LibraryDetailPage.tsx` 款式，文案一致）；调 `POST /projects/:id/soft-delete`；二次确认弹窗用 `file-staging-v2.md` §4 候选 2 模板
- **out-of-scope**：文件暂存页 UI（M3）/ 永久删除按钮（M3）

### TASK-243 文集库 L1 + L2 主视图
- **目标**：让用户能从 L1 入口看到所有已归档作品（status=`archived`）+ Collection 分组
- **in-scope**：`Layout.tsx` 加"文集库" L1 tab；新建 `LibraryPage.tsx`；路由 `/library`；顶部 Collection 卡片区（扁平分组，§7 选项 A）；下方作品陈列（按 `archivedAt` 倒序）
- **out-of-scope**：详情页（TASK-244）/ 文件暂存按钮（TASK-245）/ 书评板块（TASK-244 占位）

### TASK-244 文集库 L2 详情页
- **目标**：进入单部作品的归档详情
- **in-scope**：`LibraryDetailPage.tsx`；路由 `/library/:projectId`；作品元数据 + 章节列表（只读）+ **书评板块占位**（"AI 书评（Day 3 接入）" + 3 类 prompt 标签占位）；"编辑书评 / 加入 Collection"按钮占位
- **out-of-scope**：AI 实际调用 / Markdown 导出

### TASK-245 文集库文件暂存按钮 + Collection 基础 CRUD
- **目标**：文集库视角也能软删；Collection 1—N 关系基础操作
- **in-scope**：`LibraryDetailPage.tsx` 加"📂 放入文件暂存"按钮（同 TASK-242 款式）；`Collection` 基础 CRUD（创建 / 删除 / 移动作品到 Collection）；空 Collection 允许（M3 优化）
- **out-of-scope**：Collection 嵌套（Day 3+）/ 自动归档规则

---

## 关键背景

- 用户原话（2026-06-05）："现在 cursor 的额度已经恢复了，我希望你尽快和她取得共识，对齐进度，开始 L1 阶段的整个完成，目前只缺 编审部和文集库，先把骨架搭起来。赶紧和 cursor 进行会合吧"
- 骨架范围拍板：**中等（含 L2 主视图）**
- 出卡顺序拍板：**同时出 6 张**（编审部 3 + 文集库 3）

**Why 中等不是最薄**：最薄（路由+占位）会让 6 张卡显得空，后续 M1-B+ 填功能时还要回头改 L1 接口形状。中等（含 L2 主视图）让 L1 接口形状定下来，后续填功能是 in-place 增量。

**Why 同时出不是分批**：6 张卡边界明确、互不重叠，同时出能让用户一次性 paste review 6 张，少一轮往返。
