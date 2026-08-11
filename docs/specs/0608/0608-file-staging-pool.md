# 0608-file-staging-pool.md — 文件暂存池（线外裁决池）

> **状态**：现役 · 立宪级 · 2026-07-29 自 `docs/journal/0608-constitutional-guidance/` 取回 · 原文未改

> **文档角色**：重定义文件暂存池的产品语义、UI 命名规则、`deletedAt` 数据模型、和与 5 部门状态机的关系。明确从 `shelved` 双轨制迁移到 `deletedAt` 唯一机制。
> **优先级**：P0 — 与 `0608-dept-workspace-model.md` 并行。
> **关系**：引用 `0608-dept-workspace-model.md` §3（部门交接协议中的争议处理），输入到 `0608-legacy-freeze-list.md`（shelved 冻结项）。

---

## §0 文档元信息

- 版本号、日期、维护人
- 术语表（文件暂存、软删、线外裁决、硬删、恢复）
- 与其他文档的关系：本文是 `code-conflict-analysis.md` C-08/C-11/C-17/C-22、`file-staging-v2.md`、`day1-design.md` §7 的 0608 对齐版本

## §1 产品语义重定义

### 1.1 核心声明

文件暂存池不是删除机制，也不是归档机制。它是**线外裁决池**。

| 旧语义（v4.1） | 新语义（0608） |
|---------------|---------------|
| 文件暂存 = 软删除 | 文件暂存 = 线外裁决池 |
| 主要用途：删除不需要的作品 | 主要用途：暂存争议/暂不决定的对象 |
| deletedAt = "作品已死" | deletedAt = "作品暂停流动" |
| shelved 字面量 = 主动暂存 | shelved 冻结，仅 deletedAt |
| 恢复后自动回到原列表 | 恢复后回到原 status 所在队列 |

### 1.2 使用场景

| 场景 | 触发动作 | 示例 |
|------|---------|------|
| 裁定争议 | 下一部门对上一部门的放行有异议 | "创作室觉得这个企划不成熟" |
| 暂时搁置 | 当前部门不打算立刻处理 | "这个提案先放着" |
| 取消立项 | 企划课取消一个正在设定中的项目 | "这个 idea 先暂停" |
| 清理工作台 | 不想让某部作品出现在工作台 | "先移走，以后再说" |

### 1.3 不是删除

- 文件暂存池中的作品仍保留完整数据（proposal/project/chapters/metadata 全部保留）
- 恢复时清除 `deletedAt`，回到原 status 所在队列
- 彻底删除（hard delete）是独立操作，需要二次确认

## §2 前端 UI 约定

### 2.1 命名规则

| 上下文 | 文案 | 说明 |
|--------|------|------|
| L1 导航标题 | "📂 文件暂存" | 独立入口 |
| 触发按钮 | "📂 放入文件暂存" | 所有部门统一文案 |
| 二次确认标题 | "放入文件暂存？" | 弹窗标题 |
| 二次确认说明 | "此作品将进入文件暂存，可随时恢复。" | 消除“这是删除”的误解 |
| 恢复按钮 | "↩️ 捞回" | 从暂存池恢复 |
| 永久删除 | "🗑️ 彻底删除" | 硬删（二次确认，说明不可恢复）|
| 卡片状态 | "暂存于 {date} · 原状态：{status}" | 显示原始所属 |
| 争议原因 | 可选标签字段："暂不接收 / 待重新评估 / 搁置" | 说明为什么进入暂存池 |

### 2.2 禁止的文案

- "删除" → 除非是"彻底删除"（硬删）
- "墓园" → 已废弃
- "shelved" → 已冻结
- "回收站" → 不是回收概念

### 2.3 暂存池内的操作

| 操作 | 可用？ | 语义 |
|------|--------|------|
| 查看详情 | ✅ | 只读（或在当前部门上下文中查看）|
| 捞回 | ✅ | deletedAt = null，回到原 status |
| 彻底删除 | ✅ | 二次确认，数据物理移除 |
| 跨部门退回 | ❌ | 不属于暂存池功能 |
| 编辑内容 | ❌ | 不可以在暂存池中编辑 |
| 改变 status | ❌ | 不可以在暂存池中流转 |

## §3 数据模型

### 3.1 当前方案（确认保留）

```prisma
model Project {
  // ... 其他字段
  deletedAt DateTime?  // 文件暂存标记
  // shelved 字面量 → 冻结，不再写入
}
```

### 3.2 查询规则

```sql
-- 主流程查询（各部门工作台）
WHERE deletedAt IS NULL

-- 文件暂存池查询
WHERE deletedAt IS NOT NULL
```

### 3.3 现有端点评估

**Project 文件暂存端点**：

| 端点 | 评估 | 说明 |
|------|------|------|
| `POST /projects/:id/soft-delete` | ✅ 保留 | 设置 `deletedAt`（现有可用） |
| `POST /projects/:id/restore` | ✅ 保留 | 清除 `deletedAt`（现有可用） |
| `DELETE /projects/:id` | ✅ 保留 | 硬删（二次确认，现有可用） |
| `POST /projects/:id/shelve` | ❌ 冻结 | shelved 字面量已冻结 |
| `POST /projects/:id/restore-shelved` | ❌ 冻结 | 同上 |

**Proposal 文件暂存端点**：

| 端点 | 评估 | 说明 |
|------|------|------|
| `POST /proposals/:id/soft-delete` | 🎯 目标端点 | 当前未实现。New Commit 1 中 Proposal 暂存按钮暂不显示，不阻塞正向流程。禁止用 reject/shelve 替代。 |

### 3.4 争议场景补充（未来可选）

新增可选字段：

```prisma
model Project {
  // ...
  deletedAt         DateTime?
  stagingReason     String?    // "暂不接收" / "待重新评估" / "搁置"
  stagedByDept      String?    // {creative|planning|studio|editorial|library}
  stagedByUserAt    DateTime?  // 与 deletedAt 一致
}
```

不作为 P0，但应预留 `metadata._stagingReason` 的 JSON 元数据字段承载。

## §4 与 5 部门状态机的关系

### 4.1 核心约束

```
文件暂存池 ≠ 状态机
文件暂存池 ≠ 跨部门退回
文件暂存池 ≠ 删除
```

始终记住：

- `deletedAt` 是元层标记，不改变 `Project.status`
- 恢复时 status 保持原值（如 `archived` 恢复后仍为 `archived`）
- 暂存池中的作品不参与任何部门的待处理/进行中/已完成计数

### 4.2 争议处理流程（替代跨部门退回）

```
创作室 不认可 企划课的企划
  → 创作室将 Project 放入文件暂存（reason: "企划内容需重审"）
  → 作品在暂存池中可见，关联企划课部门标签
  → 作者（决策者）查看暂存池
  → 决策：捞回 → Project 回到 planned（仍归企划课已完成/待放行）
  → 决策：直接回到 planning（但这是"企划课内部动作"，不是创作室的动作）
  → 决策：彻底删除
```

关键原则：**裁决动作由暂存池的浏览者（作者/总经理）执行，不是由争议提出方（如创作室）执行。**

## §5 迁移路径

### 5.1 用户路径冻结（立即执行）

- 前端所有 `shelve` 按钮 → 替换为 "📂 放入文件暂存"（deletedAt 语义）
- `status: shelved` 不再出现在下拉选择、筛选器、状态标签字典中
- 旧 `shelved` 记录在 UI 中不显示为独立状态，视为"软删记录"

### 5.2 代码冻结

| 位置 | 冻结内容 |
|------|---------|
| `backend/src/constants/statuses.ts` | `shelved` 从 PRIMARY 移入 LEGACY_READ |
| `frontend/src/services/api.ts` | `shelved` 从 PROJECT_STATUS_LABEL 中移除 |
| `backend/src/middleware/stage-guard.ts` | 删除 `pause` 桶 |
| `frontend/src/components/projects/StageTransitionModal.tsx` | 替换 `shelve` 动作为 "放入文件暂存" |

### 5.3 数据迁移（非 P0）

存量 `shelved` 数据的处理方案：

```
选项 A: 全部转为 deletedAt 记录（自动化脚本）
选项 B: 保留 shelved 作为 LEGACY_READ，不再写入
选项 C: 手工审查 + 逐条迁移
```

用户已选择方案 C（文件暂存-v2.md §2.2），此非 P0，但在完全移除 shelved 前需要确认迁移方案。

## §6 不变量

1. `deletedAt IS NOT NULL` 的对象不出现在任何部门的工作台列表中
2. `deletedAt IS NOT NULL` 的对象可以出现在暂存池列表中
3. 恢复一个对象后，其 status 不变（`deletedAt = null`，status 保持）
4. 文件暂存池不改变状态机主链路
5. 文件暂存池不提供跨部门退回能力
6. 彻底删除（DELETE /projects/:id）是唯一的数据物理移除路径
