# 0608 宪法级开发指引 — 设计文档目录

> **状态**：Design v1 complete（2026-06-08）
> **声明**：本文档系列是 novel-writer 项目的**唯一设计依据**。所有旧文档（`overall-architecture.md` v4.1.1、`day1-design.md`、`code-conflict-analysis.md` 等）均已标记替代，不得再作为新开发引用。
> **更新者**：前线指挥部（Claude），执行与验证：Cursor（VPS），审批：司令部（用户）

---

## 文档索引

### 宪法层（P0 — 所有设计的引用根基）

| # | 文件名 | 角色 | 用途 |
|---|--------|------|------|
| 1 | `0608-dept-workspace-model.md` | 五部门三工作区核心模型 | 状态映射、4 次交接协议、不变量 |
| 2 | `0608-status-context-labeling.md` | 部门上下文标签系统 | `getProjectStatusLabel(status, phase)` 设计 |
| 3 | `0608-file-staging-pool.md` | 文件暂存池重定义 | shelved→deletedAt 迁移、UI 命名约定 |
| 4 | `0608-legacy-freeze-list.md` | 冻结项权威清单 | 14 项 L1~L3 冻结，Cursor 审查依据 |
| 5 | `0608-overall-architecture.md` | 系统整体架构总纲 | 替代 v4.1.1，前端/后端架构统一描述 |

### 部门实施层（各部门三工作区蓝图）

| # | 文件名 | 部门 | 角色 | 实施阶段 |
|---|--------|------|------|---------|
| 6 | `0608-creative-workspace.md` | 创意组 | 提案→企划课接收 | 📋 P4 设计就位 |
| 7 | `0608-frontend-planning-workspace.md` | 企划课 | Tab ②③④ 三工作区 | ✅ P1 已交付 |
| 8 | `architecture-studio-analysis.md` | 创作室 | 三工作区架构分析 + 端点复用 | ✅ P2 已交付 |
| 9 | `0608-editorial-workspace.md` | **编审部** | 审阅三工作区实施蓝图 | ▶️ **P3 当前阶段** |
| 10 | `0608-library-workspace.md` | 文集库 | 归档三工作区实施蓝图 | 📋 P4 设计就位 |

### 跨部门层

| # | 文件名 | 角色 | 实施阶段 |
|---|--------|------|---------|
| 11 | `0608-release-protocol.md` | 4 次部门交接（放行→接收）详细语义 | 📋 Commit 1+ |
| 12 | `0608-phase-closure.md` | 0608 阶段封版记录（基线/追认/复盘） | ✅ 已签署 |

---

## 阅读顺序

```
新读者入门：
  0608-overall-architecture       ← 系统概览（先读）
  0608-dept-workspace-model       ← 核心模型（必读）
  0608-status-context-labeling    ← 标签规则（必读）
  0608-file-staging-pool          ← 暂存语义（必读）
  0608-legacy-freeze-list         ← 冻结清单（Cursor 审查前必读）

按部门深入：
  0608-creative-workspace          ← 创意组
  0608-frontend-planning-workspace ← 企划课
  architecture-studio-analysis     ← 创作室
  0608-editorial-workspace        ← 编审部（当前 P3）
  0608-library-workspace           ← 文集库

跨部门工作：
  0608-release-protocol           ← 放行协议
```

---

## 旧文档替代状态（已全部标记）

| 旧文档 | 替代方案 | 状态 |
|--------|---------|------|
| `overall-architecture.md` v4.1.1 | `0608-overall-architecture.md` | ✅ 已标记替代 |
| `day1-design.md` | 各 0608 部门设计文档 | ✅ 已标记替代 |
| `code-conflict-analysis.md` | `0608-legacy-freeze-list.md` | ✅ 已标记替代 |
| `file-staging-v2.md` | `0608-file-staging-pool.md` | ✅ 已标记替代 |
| `intake-flow-v2.md` | `0608-creative-workspace.md` + 核心模型 | ✅ 已标记替代 |
| `editorial-dept-v2.md` | `0608-editorial-workspace.md` | ✅ 已标记替代 |
| `editorial-library-v2.md` | `0608-library-workspace.md` | ✅ 已标记替代 |

---

## 部门实施进度

```
创意组 📋（P4）
  └ 等司令部审批后推进

企划课 ✅（P1）
  └ f768af6 + 后续 commit 已交付

创作室 ✅（P2）
  ├ P2-A 三工作区列表  ✅ c1ee91a
  ├ P2-A+ 开始创作动作 ✅ 8ba7c16
  └ P2-B 纯写作编辑器整理 ✅ b72f130

编审部 ✅（P3）
  ├ P3-A 三工作区列表  ✅ 5022026
  ├ P3-A+ WorkDetailPage 编审部上下文 ✅ 377d470
  └ P3-B ReviewDetailPage ✅ 6d9669b

文集库 ✅（P4）
  ├ P4-A 三工作区列表  ✅ b184e6f
  ├ P4-A+ WorkDetailPage 文集库上下文 ✅ 451f97e
  └ P4-B 文集库阶段标签 ✅ ab7e346
```

## 设计原则（10 条）

1. **五部门三工作区** — 每部门有自己独立的待处理/进行中/已完成
2. **确认完成 ≠ 放行下一部门** — 同一部门内动作分离
3. **不允许跨部门退回** — 争议走文件暂存池
4. **允许部门内退回** — `planned→planning`、`reviewing→writing` 等
5. **文件暂存 ≠ 状态机** — `deletedAt` 是元标记，不改变 status
6. **部门上下文决定标签** — 同一 status 在不同部门不同含义
7. **L1 是提交动作串联，不是 status 桶**
8. **单层全局标签废弃** — 改用 `getProjectStatusLabel(status, phase)`
9. **拒绝 1.0 思维污染** — 2.0+ 编审部 = 全文 AI 审查 + 非卡点 + prompt 驱动
10. **每枪 commit 小而可审** — 控制在 1 文件 / ~15 行量级，零夹带，零后端依赖
