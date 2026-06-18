# 三方讨论：五阶段前台命名规范 + 战役 A（状态契约）+ 战役 B（提案阶段隔离）

> 场景：司令官 ↔ 架构参谋(Claude) ↔ 前线指挥官(Cursor)
> 目标：三方对齐后逐项确认执行

---

## §0 核心约定（司令官已拍板）

### 0.1 状态标签 = 阶段上下文 + 状态

同一个 `status` 在不同阶段上下文显示不同标签：

| status | 企划课 | 创作室 |
|--------|--------|--------|
| `planning` | **审核中立项作品**（有「正式立项」按钮） | 不出现 |
| `planned` | **已立项作品**（保留展示） | **待创作作品** |
| `writing` | 不出现 | **创作中作品** |
| `written` | 不出现 | **已创作作品** |

上一阶段的成果在前一阶段保留展示。每一阶段三个状态归一：**待完成 → 正在进行 → 已完成**。

### 0.2 五阶段关键词体系

| 阶段 | 关键词 | 状态标签 |
|------|--------|---------|
| 创意组 | 创意 | 创意提案（Proposal） |
| 企划课 | 立项 | 审核中/已立项 |
| 创作室 | 创作 | 待创作/创作中/已创作 |
| 编审部 | 审阅 | 待审阅/审阅中/已审阅 |
| 文集库 | 归档 | 已归档 |

前端 labels 服从后端 statuses，不做独立命名体系。

### 0.3 元数据

- 去掉 WorkDetailPage 独立的「元数据」Tab
- 并入「作品设定」页内部，作为可展开面板
- 编辑器内不留元数据编辑入口
- ReferenceSidebar 保留元数据只读展示（写作时参考）
- 作品设定 + 元数据 → 将来汇入 AI prompt

---

## 核心矛盾

后端按 v4.1 设计用 `statuses.ts` 定义 canonical 状态表（`planning/planned/writing/written/reviewing/reviewed/archived` 以及 `creating/created/approved/shelved`），但前端仍活在 legacy 枚举（`draft/submitted/completed`）中。两端之间没有统一的状态映射层。

---

## 战役 A — 状态契约统一

### 讨论点 A1 — 映射层放哪里？

**选项 A**：在 `frontend/src/services/api.ts` 中增加映射
**选项 B**：新建 `frontend/src/services/status-migration.ts` 独立文件
**选项 C**：仅改前端枚举去掉 legacy

**需 Cursor scout**：
- 后端 `status-migration.ts` 完整映射表
- 前端 `PROJECT_STATUSES` / `PROPOSAL_STATUSES` 被多少文件间接使用
- `Legacy` 值分类：哪些用作 filter、哪些用作 label

### 讨论点 A2 — Proposal API 是否需要映射？

**需 Cursor scout**：
- 后端 proposals 路由哪些响应未走 `withMappedProposalStatus`
- 现有前端 filter 中 `'draft'` / `'submitted'` 的使用上下文

### 讨论点 A3 — 过滤统一 + label 表重构

需设计：
1. `mapProjectStatus` / `mapProposalStatus` 映射函数
2. 分阶段的 status label 映射（同一 status 在不同阶段不同标签）
3. `isProposalSubmitted(p)`、`isProjectInPlanning(p)` 等 helper

**需 Cursor scout**：
- 列出所有 `proposals.filter(...)` 和 `projects.filter(...)` 调用点
- 当前 `PROJECT_STATUS_LABEL` / `PROPOSAL_STATUS_LABEL` 完整内容
- `ProjectStatusBadge` / `ProposalStatusBadge` 的渲染逻辑

---

## 战役 B — 提案阶段隔离

### 讨论点 B1 — 创意组「企划建议书」Tab 定位

§0.2 已确认命名：创意组用「创意提案」，企划课用「企划建议书评估」

**选项 A**：降级为只读列表 + 送审，移除 evaluate 弹窗
**选项 B**：保留 reject/shelve + 过渡提示

**需 Cursor scout**：
- `PlanningProposal` 当前 evaluate 弹窗有哪些 action、API 调用路径
- 移除 evaluate 后，reject/shelve 的替代入口在哪里
- 创意组「查看作品」链接条件

### 讨论点 B2 — 两个「企划建议书」同名的 label 改动

§0.2 已确认：
- 创意组 → 创意提案（`/creative/proposals`）
- 企划课 → 企划建议书评估（`/planning/proposals`）

**需 Cursor scout**：
- Layout sub 导航 + CreativePage Tab 中的 label 位置
- `ProposalDetailPage` 标题是否受影响

### 讨论点 B3 — 统一退回 API

**需 Cursor scout**：
- 后端 `POST /reject` 是否存在、响应格式
- 当前两条退回路径（`updateStatus('draft')` vs `evaluate('reject')`）的写入 status
- 后端 `assertProposalStatusForWrite` 是否拦截 `PUT /status` 直写 legacy

---

## 战役 C — 元数据整合（设计确认后的新增）

### 讨论点 C1 — WorkDetailPage Tab 结构调整

当前 Tab：`作品设定 | 章节列表 | 元数据`

改成：`作品设定（含元数据）| 章节列表`

元数据作为作品设定页面的**可展开面板**，收在页面内部。

**需 Cursor scout**：
- `WorkDetailPage.tsx` 中 `activeTab` 切换逻辑
- `ContentMetadataCard` 当前的渲染数据和位置
- 元数据的读写 API 路径

### 讨论点 C2 — ReferenceSidebar 元数据展示

编辑器参考侧栏中保留元数据只读展示。

**需 Cursor scout**：
- `ReferenceSidebar` 当前渲染的内容和数据结构
- 加入元数据展示的区域在哪里（已有板块还是新增）

---

## 执行建议顺序

```
§0 命名规范落地（StatusLabel 表重构）
  → 战役 A（映射层 + filter 修复）
    → 战役 B（提案流阶段隔离）
      → 战役 C（元数据整合）
```

## Cursor 行动要求

对每个讨论点的 `需 Cursor scout` 逐项回答，格式：

```
## 讨论点 A1
[文件路径:行号] [当前代码] [分析]
```
