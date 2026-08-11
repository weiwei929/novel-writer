# 0608-release-protocol.md — 跨部门放行协议

> **状态**：现役 · 立宪级 · 2026-07-29 自 `docs/journal/0608-constitutional-guidance/` 取回 · 原文未改

> **文档角色**：定义 4 次部门交接（放行→接收）的详细产品语义、数据模型、UI 行为和端点设计。
> **优先级**：P1 — Commit 1+ 开始跨部门放行前必须。
> **关系**：引用 `0608-dept-workspace-model.md` §3（4 次交接协议原则）、`0608-overall-architecture.md` §4（放行总览）。

---

## §0 核心原则

1. **放行≠改变 status。** `planned` 放行后仍为 `planned`，`written` 放行后仍为 `written`。放行只记录"已交接"标记。
2. **放行≠开始下一阶段工作。** 创作室接收 `planned` 作品后，需要手动点"开始创作"才进入 `writing`。
3. **放行是源部门动作。** 企划课放行至创作室、创作室放行至编审部、编审部放行至文集库。目标部门被动接收。
4. **争议不走跨部门退回。** 目标部门对源部门的放行有异议→走文件暂存池线外裁决。

---

## §1 数据结构

### 1.1 放行标记（推荐字段）

```prisma
model Project {
  // ... 其他字段
  greenlitAt      DateTime?  // 最后一次被放行的时间（非自动开始写作）
  currentDept     String?    // 'planning' | 'studio' | 'editorial' | 'library'

  // 可选：逐次记录放行历史（非 P0）
  // releasedToStudioAt    DateTime?
  // releasedToEditorialAt DateTime?
  // releasedToLibraryAt   DateTime?
}
```

### 1.2 部门判定规则

作品中当前属于哪个部门，由 `currentDept` 结合 `status` 推导：

| 条件 | 所属部门 |
|------|---------|
| `currentDept = 'planning'` 或 `status = planning/planned` 且未放行 | 企划课 |
| `greenlitAt != null` 且 `status in (planned, writing, written)` | 创作室 |
| `currentDept = 'editorial'` | 编审部 |
| `currentDept = 'library'` | 文集库 |

**简化方案（推荐）**：P3 前不使用 `currentDept` 和逐次时间戳，仅用 `greenlitAt` 区分"是否已被放行过"。企划课视图中 `deletedAt IS NULL AND greenlitAt IS NULL`，创作室视图中 `deletedAt IS NULL AND greenlitAt IS NOT NULL AND status IN ('planned','writing','written')`。

---

## §2 交接 ①：企划课 → 创作室

### 2.1 触发条件

- `Project.status = 'planned'`
- `Project.deletedAt IS NULL`
- `Project.greenlitAt IS NULL`（尚未放行过）

### 2.2 放行动作

**按钮文案**：放行至创作室（企划课 Tab ④ 已完成/待放行区）

**调用**：`POST /projects/:id/release-to-studio`

**后端行为**：
- 设 `greenlitAt = now`
- 不改 `Project.status`（仍为 `planned`）
- 记录放行时间戳

**前端行为**：
- 成功 → toast"已放行至创作室"
- 停留在企划课 Tab ④ 视图
- 作品从"待放行"子视图移到"已放行"子视图
- ❌ 不自动导航到创作室
- ❌ 不打开编辑器

### 2.3 接收表现

创作室"待创作"区查询条件：
```typescript
Project.status === 'planned' AND greenlitAt IS NOT NULL AND deletedAt IS NULL
```

艺术家创作室视图中，`planned` 作品现在显示在"待创作"区。

### 2.4 注意事项

- `planned` → 仅放行记录，不改变 status
- 创作室决定何时"开始创作"（`planned→writing`）
- New Commit 1 范围：⚠️ 不放行按钮。`planned` 作品出现在企划课 Tab ④ 后，放行按钮留待 **Commit 1+**

---

## §3 交接 ②：创作室 → 编审部

### 3.1 触发条件

- `Project.status = 'written'`
- `Project.deletedAt IS NULL`
- 创作室确认全本创作完成

### 3.2 放行动作

**按钮文案**：放行至编审部（创作室"已完成"区）

**调用**：`POST /projects/:id/release-to-editorial`

**后端行为**：
- 设 `currentDept = 'editorial'`
- 不改 `Project.status`（仍为 `written`）

**前端行为**：
- 成功 → toast"已放行至编审部"
- 停留在创作室视图
- 作品从"已完成"移到"已放行"子视图

### 3.3 接收表现

编审部"待审阅"区：
```typescript
Project.status === 'written' AND currentDept === 'editorial' AND deletedAt IS NULL
```

### 3.4 注意事项

- 当前阶段不实现放行至编审部按钮（Commit 3+）
- `written→reviewing` 是编审部内部"开始审阅"动作

---

## §4 交接 ③：编审部 → 文集库

### 4.1 触发条件

- `Project.status = 'reviewed'`
- `Project.deletedAt IS NULL`

### 4.2 放行动作

**按钮文案**：放行至文集库（编审部"已完成"区）

**调用**：`POST /projects/:id/release-to-library`

**后端行为**：
- 设 `currentDept = 'library'`
- 不改 `Project.status`（仍为 `reviewed`）

### 4.3 接收表现

文集库"待归库"区：
```typescript
Project.status === 'reviewed' AND currentDept === 'library' AND deletedAt IS NULL
```

### 4.4 注意事项

- 当前阶段不实现放行至文集库按钮（Commit 4+）
- 文集库归档操作将 `status` 设为 `archived`

---

## §5 交接 ④：创意组 → 企划课

创意组到企划课的交接已有完整实现（v4.1 `POST /proposals/:id/accept-into-planning`）：

1. 创意组提案状态 `approved`
2. 企划课 Tab ② 中看到提案
3. 点击"接收入企划课"
4. 后端创建 `Project(status: 'planning')`，关联 `proposalId`
5. `Proposal` 标记 `approved`
6. 项目出现在企划课 Tab ③ 进行中列表

**0608 验证**：
- ✅ 确认完成 ≠ 放行（创意组提案通过 = 确认完成，企划课接收 = 放行+接收）
- ✅ 不跨部门退回（企划课不退回创意组）
- ✅ 走文件暂存替代 reject

---

## §6 端点汇总

| 端点 | 动作 | 状态改变 | 当前阶段 |
|------|------|---------|---------|
| `POST /proposals/:id/accept-into-planning` | 接收入企划课 | 创建 `Project(planning)` | ✅ 已有 |
| `POST /projects/:id/release-to-studio` | 放行至创作室 | 设 `greenlitAt` | 🎯 Commit 1+ |
| `POST /projects/:id/release-to-editorial` | 放行至编审部 | 设 `currentDept` | 🎯 Commit 3+ |
| `POST /projects/:id/release-to-library` | 放行至文集库 | 设 `currentDept` | 🎯 Commit 4+ |
| `POST /projects/:id/start-writing` | 开始创作 | `planned → writing` | ✅ 已有 |
| `POST /projects/:id/confirm-planning-complete` | 确认企划完成 | `planning → planned` | ✅ 兼容 `confirm-greenlight` |
| `POST /projects/:id/transition` | 通用转换 | 以参数指定 | ✅ 已有 |

---

## §7 不变量

1. 放行不改变 `Project.status`
2. `greenlitAt` 非空的作品不可再次放行（已进入下一部门）
3. 放行后不可撤回（争议走文件暂存池）
4. 放行端点只由源部门触发，目标部门不可主动拉取
