# 0608-design-work-synopsis-unification.md — work.synopsis 统一方案

> **文档角色**：`description` vs `metadata.synopsis` 双字段统一设计方案。
> **优先级**：P1 设计阶段 — 先锁定方案，P2 实施。
> **状态**：Design v1（2026-06-11）

---

## §1 问题

`Project` 模型有两个字段承载"作品梗概"语义：

| 字段 | 位置 | 类型 | 1.0 遗留？ |
|------|------|------|:--:|
| `description` | `Project.description` | `String?` | ✅ 是，1.0 "项目简介" |
| `metadata.synopsis` | `Project.metadata` JSON 中的 key | any | ✅ 是，AI 提取产物 |

当前前端读取逻辑（`WorkDetailPage.getWorkSynopsis`）：

```
metadata.synopsis → description（fallback）
```

问题：
1. 两个字段可能并存且内容不同，提示文案"将来会统一"但无具体方案
2. 写入路径分散：`ProjectMetadataPanel` 写 metadata.synopsis，`projectsApi.update` 可写 description
3. 没有哪个是"真相源"的明确声明

---

## §2 目标

> **work.synopsis 是唯一的作品梗概真相源。**

- 短期存储位：`metadata.synopsis`（不改数据库）
- 远期迁移：`Project` 表新增独立 `synopsis` 字段
- `description` 降级为："作品副描述/补充说明"，不再是梗概来源

---

## §3 读取优先级

```
work.synopsis 读取:
  1. metadata.synopsis  — 主存储位（当前实现）
  2. description        — legacy fallback（仅当 metadata.synopsis 不存在时）
```

**前端实现不变**：`getWorkSynopsis()` 已按此顺序实现。无需代码改动。

---

## §4 写入策略

### 4.1 写入目标

| 写入入口 | 写到哪里 | 行为 |
|---------|---------|------|
| `ProjectMetadataPanel`（编辑作品元数据） | `metadata.synopsis` | ✅ 已正确，不改 |
| `projectsApi.update({ description })` | `Project.description` | ⚠️ 仅写 description，不写 synopsis |
| 创建作品（`CreateProjectModal`） | 初始梗概写入 `metadata.synopsis` | ✅ 已正确 |

### 4.2 写入规则（P2 实施）

```
规则 1: 所有"作品梗概"写入必须走 metadata.synopsis
规则 2: 写入 metadata.synopsis 时，可选同步更新 description（保持兼容）
规则 3: 写入 description 时，不自动写入 metadata.synopsis（description 不再是梗概源）
规则 4: 新建作品时，initialSynopsis 写入 metadata.synopsis，不再写入 description
```

---

## §5 冲突保留策略

当 `metadata.synopsis` 和 `description` **同时存在且内容不同**时：

### 当前行为

WorkDetailPage 显示提示：
> "梗概当前存储在内容元数据中，与项目描述字段不同。将来会统一为 work.synopsis。"

### P2 改进

```
短期（P2）:
  - 保持双重显示 + 提示
  - 在 ProjectMetadataPanel 中增加"同步到项目描述"按钮
  - 编辑 synopsis 后自动覆盖 description（可选开关）

长期（P3 迁移后）:
  - description 不再与 synopsis 冲突（语义分离）
  - 提示移除
```

---

## §6 迁移步骤

```
P1（当前）:
  ✅ 设计文档锁定（本文）
  ✅ 前端读取逻辑已以 metadata.synopsis 为主（getWorkSynopsis）

P2（实施）:
  □ 写入统一：所有梗概写入走 metadata.synopsis
  □ ProjectMetadataPanel 增加"同步到描述"按钮
  □ 文档中标注 description 为"补充说明"，不再是梗概

P3（远期）:
  □ Prisma 新增 Project.synopsis 字段
  □ 存量数据迁移：metadata.synopsis → Project.synopsis
  □ getWorkSynopsis 改为读取 Project.synopsis
  □ description 字段语义正式分离
  □ metadata.synopsis 废弃/删除
```

---

## §7 不变量

1. `work.synopsis` 是唯一作品梗概概念，不因存储位置变化而改变
2. 前端 `getWorkSynopsis()` 是唯一读取入口，外部不直接访问 `metadata.synopsis` 或 `description`
3. 迁移过程不丢数据——所有 `metadata.synopsis` 和 `description` 存量全部保留

---

## §8 记录

| 时间 | 事件 |
|------|------|
| 2026-06-11 | Design v1。work.synopsis 统一方案：读取优先级 + 写入策略 + 冲突策略 + 三步迁移。 |
