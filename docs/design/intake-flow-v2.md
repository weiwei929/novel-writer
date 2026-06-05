# Novel Writer 导入流程 v2（2026-06-05）

> 状态：Day 2 设计定案（用户 2026-06-05 拍板，决策 1 = 选项 A）。
> 配套：本设计基于 5 部门 L1 平铺原则（v4.1）+ 多部作品并发管理判断锚点。
> 关联文档：overall-architecture.md §0、day1-design.md §0/§3/§12.1、editorial-dept-v2.md §6.1/§6.4、editorial-library-v2.md §6.4。

---

## §0 一句话总结

**2.0+ 正确导入流程**：外部文件 → 创意组 外来参考（FileReference）→ 创意组 讨论 → 企划建议书（Proposal）→ 企划课 立项评估 → **唯一 Project 入口**（status=`planning`）。

`imported` Project 字面量 = **1.0 残留 bug**，2.0+ 移除（迁移 `imported` → `planning`，详见 §8）。

---

## §1 1.0 残留 bug 说明

### 1.1 1.0 时代问题

1.0 时代"外部导入"会**直接创建 Project**（`status='imported'` 或 `status='draft'`），**绕过**了：
- 创意组 外来参考（FileReference）
- 创意组 创意讨论（AI 创意合伙人）
- 企划建议书（Proposal）
- 企划课 立项评估（节点 #1 三选一）

直接后果：
- 用户导入的草稿**没有**经过 创意组 讨论就被立项
- 创意组 L1 入口（外来参考 / 灵感手记 / 创意讨论）对该草稿"视而不见"
- 5 部门 L1 平铺原则被破坏——**导入** = 跳过了 2 个部门（创意组 + 企划课）

### 1.2 1.0 残留代码 4 处

| 位置 | 1.0 残留 | 2.0+ 改后 |
|------|---------|---------|
| `backend/src/constants/statuses.ts:7` | `PROJECT_STATUS_PRIMARY` 含 `imported`（9 primary）| 8 primary，`imported` 移到 LEGACY_READ |
| `backend/src/middleware/stage-guard.ts:5` | `intake: ['imported']` 桶 | 删除 `intake` 桶（5 桶变 4 桶）|
| `backend/src/middleware/stage-guard.ts:34` | `IN_BUCKET_TRANSITIONS.imported: []` | 删除该行 |
| `backend/src/services/status-migration.ts:9` | `imported: 'imported'` 映射 | 删除（`imported` 走迁移脚本到 `planning`）|
| `backend/src/routes/projects.ts:692-704` | `POST /projects/:id/move-to-planning` 端点（`imported → planning`）| 删除端点（`imported` 不存在，无源转换）|
| `backend/prisma/migration.sql:18` | `WHERE status='draft' AND NOT (...)` → `imported` | 改新流程不产 `imported` |

---

## §2 2.0+ 正确流程

### 2.1 完整流程图

```
[外部文件] (PDF/DOCX/MD/图片/链接)
   ↓ POST /file-references (创建)
[创意组 外来参考] (FileReference, 不带 status — 始终可用)
   ↓ (用户决定: 立项? 还是仅参考)
[创意组 创意讨论] (AI 创意合伙人 对话模式, FileReference 作上下文)
   ↓ (讨论产出 → "引用到建议书" 按钮)
[创意组 企划建议书] (Proposal.status='creating' → 手工编辑)
   ↓ POST /proposals/:id/submit (节点 #1: created)
[企划课 立项评估] (Tab ②)
   ↓ 三选一: 通过 / 退回 / 删除
   ├─ 通过 → POST /proposals/:id/accept-into-planning
   │         ↓
   │      [Project 创建] (status='planning', submittedToPlanningAt=now)
   │         ↓ ... → 创作室
   ├─ 退回 → Proposal.status='creating' (回 创意组 可编辑)
   └─ 删除 → Proposal.deletedAt=now (文件暂存)
```

### 2.2 关键不变量

- **唯一 Project 入口** = 企划课 `accept-into-planning`（不再有"导入 = Project"快捷路径）
- **FileReference 永远在 创意组 阶段**，**不**流转到 Project（FileReference 是 提案/Proposal 阶段 artifact，不是 Project 阶段 artifact）
- **跨 Project 复用**外来参考：FileReference 通过 `proposalId` 关联 Proposal，Proposal 立项后通过 `proposalId` 关联 Project（`schema.prisma:70-71` 已有此关系）
- **"导入"端点** = `POST /file-references`（**已存在**于 `backend/src/routes/fileReferences.ts`），**不**是 `POST /projects/import`

### 2.3 与 1.0 差异对照

| 维度 | 1.0 (bug) | 2.0+ (fix) |
|------|-----------|-----------|
| "导入"语义 | 创建 Project (status=imported) | 创建 FileReference (创意组 外来参考) |
| Project 起点状态 | `imported` | `planning` |
| 必经阶段 | 直接进 创作室 | FileReference → 创意组 讨论 → Proposal → 企划课 → 创作室 |
| 5 部门 L1 平铺 | 破坏（跳过 创意组 + 企划课） | 完整（必经 2 个 L1 部门） |
| AI 创意合伙人 | 跳过 | 必经（创意组 创意讨论） |

---

## §3 FileReference 角色定位

### 3.1 模型与字段

来源：`backend/prisma/schema.prisma:220`

```
model FileReference {
  id              String   @id @default(uuid())
  fileName        String
  fileContent     String?
  fileType        String   @default("md")
  sourceUrl       String?
  processingType  String   @default("none") // complete | partial | none (Type 1/2/3)
  proposalId      String?     ← 关联到 Proposal（创意组 阶段 artifact）
  annotations     Json?
  comment         String?
  tags            Json?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**关键**：
- FileReference **不带** status 字段（始终"在库"状态，没有"归档/删除"概念）
- FileReference 仅关联 `proposalId`，**不**关联 `projectId`（创意组/提案阶段 artifact，不进 Project 阶段）
- 唯一"软删"途径 = `proposalId` 关联的 Proposal 进文件暂存时连带隐藏

### 3.2 L1 入口位置

**创意组 L2 第一个 Tab = 外来参考**（v4.1 §3.2）：
- 列表视图（filename / type / createdAt / optional comment）
- 操作：[+ 导入] 按钮（上传新文件）
- 列表项展开：显示内容预览 + 点评输入框（可选）+ 引用到建议书 按钮

### 3.3 端点（已存在，Day 2 不动）

来源：`backend/src/routes/fileReferences.ts`

- `POST /file-references`（创建）— **2.0+ 唯一"导入"端点**
- `GET /file-references`（列表）
- `GET /file-references/:id`（详情）
- `PUT /file-references/:id`（更新，如补点评/标签）
- `DELETE /file-references/:id`（删除，仅当未引用到 Proposal 时允许）

---

## §4 Proposal 角色定位

### 4.1 模型与字段

来源：`backend/prisma/schema.prisma:236`

```
model Proposal {
  id          String   @id @default(uuid())
  title       String
  synopsis    String?  // 故事梗概
  innovation  String?  // 创新点
  coreSetting String?  // 核心设定（高层自由描述）
  status      String   @default("draft")  // primary 4: creating | created | approved | shelved（**Day 2 方案 C 移除 shelved**，详见 file-staging-v2.md）
  deletedAt   DateTime?
  references  Json?    // 引用材料列表 [{ type, id, title, processingType? }]
  sourceNotes String?  // 来源讨论记录
  metadata    Json?    // _evaluation, _tags, _discussionSubmitted, _sourceRef 等
  projectId   String?  // 立项后关联项目
  ...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.2 4 字面量语义

| 字面量 | 语义 | 触发 |
|--------|------|------|
| `creating` | 提案编辑中（创意组 可编辑）| 创建 Proposal 默认值 |
| `created` | 提案完成（待企划课评估）| `POST /proposals/:id/submit` |
| `approved` | 提案已通过企划课（立项）| `POST /proposals/:id/accept-into-planning`（同时创建 Project）|
| ~~`shelved`~~ | ~~主动暂存（用户手动）~~ | **Day 2 方案 C 取消**（详见 `file-staging-v2.md` §2.2）|

### 4.3 与 FileReference 关系

- `Proposal.references = [{ type: 'file-reference', id: '...', title: '...', processingType: 'complete' }]`
- 这是 JSON 数组引用（**不**是外键关系），允许多对多
- FileReference 可被多个 Proposal 引用（同一份参考材料可支持多份提案）

---

## §5 Project 角色定位

### 5.1 唯一入口

**`POST /proposals/:id/accept-into-planning`**（企划课 节点 #1 通过）= 唯一创建 Project 的方式。

### 5.2 创建时字段

- `status = 'planning'`（**永远不**是 `imported`）
- `submittedToPlanningAt = now()`
- `proposalId = <proposal.id>`（关联到来源 Proposal）
- `greenlitAt = null`（尚未正式立项）
- `proposal = Proposal`（双向关系）

### 5.3 立项总账视图

`Project.greenlitAt IS NOT NULL` 是企划课 Tab ④ "立项总账"的筛选条件，**与** `status` **解耦**（v4.1 §0 Day 1 关键变化）。

立项总账里看得到所有曾立项作品（含 writing/written/reviewing/reviewed/archived/文件暂存），不限于 `planning/planned`。

---

## §6 端点映射

### 6.1 2.0+ 端点全景（与 1.0 对照）

| 阶段 | 1.0 端点 (bug) | 2.0+ 端点 (fix) |
|------|----------------|------------------|
| 创意组 导入 | `POST /projects/import` (→ imported) | `POST /file-references` (→ FileReference) |
| 创意组 提案 | `POST /proposals` (→ draft) | `POST /proposals` (→ creating) |
| 创意组 提案完成 | `POST /proposals/:id/submit` (→ created) | 不变 |
| 企划课 立项 | `POST /proposals/:id/accept-into-planning` (→ Project draft) | 不变（但 Project.status 改为 `planning`）|
| 企划课 正式立项 | `POST /projects/:id/confirm-greenlight` (→ planned) | 不变 |
| 企划课 退回 | `POST /proposals/:id/reject` (→ Proposal draft) | 不变（但 Proposal.status 改为 `creating`）|
| 创作室 加工 | `POST /projects/:id/move-to-planning` (→ imported → planning) | **删除**（无 `imported` 状态）|

### 6.2 删除的端点

- `POST /projects/:id/move-to-planning` (projects.ts:692-704) — **Day 2 移除**（`imported` 不存在，无源转换）
- `POST /projects/import` — **Day 2 移除**（如存在，新建 = FileReference 而非 Project）

### 6.3 新增/保持的端点

- `POST /file-references` — **保持**（2.0+ 唯一"导入"端点）
- `POST /proposals` — **保持**（语义改为 `creating` 而非 `draft`）
- `POST /proposals/:id/submit` — **保持**
- `POST /proposals/:id/accept-into-planning` — **保持**（但产出 Project.status=`planning` 而非 `draft`）

---

## §7 状态字面量变化

### 7.1 Project 字面量 9 → 8

| 1.0 字面量 (9 primary) | 2.0+ 字面量 (8 primary) |
|------------------------|--------------------------|
| `imported` (1.0 残留) | **删除**（迁移到 `planning`）|
| `planning` | `planning` |
| `planned` | `planned` |
| `writing` | `writing` |
| `written` | `written` |
| `reviewing` | `reviewing` |
| `reviewed` | `reviewed` |
| `archived` | `archived` |
| ~~`shelved`~~ | **legacy read-only**（Day 2 方案 C 移除）|

### 7.2 Legacy Read 字面量 +1

| 1.0 legacy read (2) | 2.0+ legacy read (3) |
|----------------------|------------------------|
| `draft` | `draft` |
| `completed` | `completed` |
| — | **`imported`**（新增）|

### 7.3 总数对照

- 1.0：9 primary + 2 legacy read = **11 字面量**
- 2.0+：8 primary + 3 legacy read = **11 字面量**（总数不变，字面量重新分配）

### 7.4 stage-guard 桶 5+1 → 4+1

| 1.0 桶 (5+1) | 2.0+ 桶 (4+1) |
|---------------|----------------|
| `intake: ['imported']` | **删除**（无 intake 桶）|
| `planning: ['planning', 'planned']` | `planning: ['planning', 'planned']` |
| `studio: ['writing', 'written']` | `studio: ['writing', 'written']` |
| `editorial: ['reviewing', 'reviewed']` | `editorial: ['reviewing', 'reviewed']` |
| `terminal: ['archived']` | `terminal: ['archived']` |
| ~~`pause: ['shelved']`~~ | **Day 2 方案 C 取消**（详见 `file-staging-v2.md`）|

---

## §8 迁移计划（决策 1 = 选项 A）

### 8.1 迁移目标

**Day 2 上线时**：
- 现有 DB 中所有 `status='imported'` 的 Project 全部迁移到 `status='planning'`
- 写入审计日志（`metadata._importedMigration = { migratedAt, from: 'imported', to: 'planning', reason: '1.0 残留 bug 修复 (Day 2 决议)' }`）
- `submittedToPlanningAt` 字段若为 null，设为迁移时间（视为"刚进入企划课"）

### 8.2 迁移 SQL 草图

```sql
-- Day 2 上线时一次性迁移
UPDATE Project
SET
  status = 'planning',
  submittedToPlanningAt = COALESCE(submittedToPlanningAt, datetime('now')),
  metadata = json_set(
    COALESCE(metadata, '{}'),
    '$._importedMigration',
    json_object(
      'migratedAt', datetime('now'),
      'from', 'imported',
      'to', 'planning',
      'reason', '1.0 残留 bug 修复 (Day 2 决议)'
    )
  )
WHERE status = 'imported' AND deletedAt IS NULL;
```

### 8.3 迁移不变量校验

- 迁移后 DB 中无 `status='imported'` 的非文件暂存 Project
- 迁移后 `metadata._importedMigration` 字段存在（审计追溯）
- `status-migration.ts` 中 `imported` 映射删除（运行时不应再遇到 `imported` 字面量）

### 8.4 旧端点处理

- `POST /projects/:id/move-to-planning` (projects.ts:692-704) — **Day 2 上线时删除**
- 旧调用方迁移到 `POST /proposals/:id/accept-into-planning`（语义等价：创建/进入企划课）

---

## §9 决策日志

| 日期 | 决策 | 决定 | 备注 |
|------|------|------|------|
| 2026-06-05 | 1.0 残留 bug 识别 | `imported` Project 字面量 = 1.0 残留（导入跳过 创意组 + 企划课）| 用户指出"我说的不是草稿，是外来参考" |
| 2026-06-05 | 2.0+ 正确流程 | FileReference → 创意组 讨论 → Proposal → 企划课 → Project | 5 部门 L1 平铺原则修复 |
| 2026-06-05 | 决策 1 = 选项 A | 迁移 `imported` → `planning` + 审计日志 | 2.0 启动后状态机纯净 |
| 2026-06-05 | 唯一 Project 入口 | `POST /proposals/:id/accept-into-planning` | 替代 `POST /projects/import` 快捷路径 |
| 2026-06-05 | 字面量数变化 | Project 9 primary → 8 primary（`imported` 移到 legacy read）| 总数 11 不变 |
| 2026-06-05 | stage-guard 桶变化 | 5+1 → 4+1（删除 `intake` 桶）| Project 起点 = `planning` |
| 2026-06-05 | 端点变化 | 删除 `POST /projects/:id/move-to-planning`，保持 `POST /file-references` | 详见 §6 |
| 2026-06-05 | 决策 2（端点命名确认） | `POST /file-references` 是 2.0+ 唯一"导入"端点 | 已存在，无需新建 |

---

## §10 留给 Cursor 恢复后的 TODO

### 10.1 代码改动清单（Cursor 执行）

- [ ] `backend/src/constants/statuses.ts` — `PROJECT_STATUS_PRIMARY` 9 → 8，`imported` 移到 `LEGACY_READ`
- [ ] `backend/src/middleware/stage-guard.ts` — 删除 `intake: ['imported']` 桶 + `IN_BUCKET_TRANSITIONS.imported: []` 行
- [ ] `backend/src/services/status-migration.ts` — 删除 `imported: 'imported'` 映射行
- [ ] `backend/src/routes/projects.ts:692-704` — 删除 `POST /projects/:id/move-to-planning` 端点
- [ ] `backend/prisma/migration.sql` — 新增 §8.2 迁移 SQL
- [ ] `backend/prisma/schema.prisma:33` — 注释更新（11 字面量 → 11 字面量但 `imported` 标 legacy）

### 10.2 文档改动清单（已完成 2026-06-05）

- [x] `docs/design/day1-design.md` §0 "11 个状态值" → "10 个状态值（Day 2 移除 `imported`）"
- [x] `docs/design/day1-design.md` §3 状态机表 `imported` 行标 Day 2 决议移除 + 流转图删除 `imported` 起点
- [x] `docs/design/day1-design.md` §12.2 C-05 移到 §12.1 已锁决策（Day 2 决议）
- [x] `docs/design/editorial-dept-v2.md` §6.1 9 primary → 8 primary + `imported` 移到 legacy
- [x] `docs/design/editorial-dept-v2.md` §6.4 `imported` 描述更新为 legacy read-only
- [x] `docs/design/editorial-library-v2.md` §6.4 新增 `imported` 1.0 残留说明
- [x] `docs/design/intake-flow-v2.md` — **新写**（本文档）

### 10.3 测试清单

- [ ] 单元测试：`PROJECT_STATUS_PRIMARY` 长度 = 8
- [ ] 单元测试：`PROJECT_STATUS_LEGACY_READ` 长度 = 3
- [ ] 单元测试：迁移 SQL 后 DB 无 `status='imported'` 非文件暂存 Project
- [ ] 集成测试：`POST /file-references` 创建后，**不**自动创建 Project
- [ ] 集成测试：`POST /proposals/:id/accept-into-planning` 创建 Project，status='planning'（**不**是 'imported'）

---

## §附录 A：5 部门 L1 与导入流程的整合

### A.1 5 部门 L1 全流程覆盖

| 部门 L1 | 导入流程中的角色 | 必经阶段？ |
|---------|------------------|-----------|
| 创意组 | 外来参考 + 创意讨论 + 企划建议书 | **必经**（2 个 Tab）|
| 企划课 | 立项评估 | **必经**（Tab ②）|
| 创作室 | 写作 + 编辑 | 必经（`planning → planned → writing`）|
| 编审部 | AI 审查（可选）| 可选（`written → reviewing`）|
| 文集库 | 归档（终态）| 必经（最终 `→ archived`）|

**关键**：导入流程**必经** 创意组 + 企划课 + 创作室 + 文集库 4 个 L1 部门（编审部可选），**不**跳过任何 L1。这与"5 部门 L1 平铺原则"完全一致。

### A.2 必经 vs 可选

- **必经**（4 个）：创意组 → 企划课 → 创作室 → 文集库
- **可选**（1 个）：编审部（AI 审查，不卡提交文集库）

详见 `editorial-dept-v2.md` §3（编审部 4 核心特征：非卡点）。
