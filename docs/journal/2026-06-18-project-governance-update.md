# 项目文件治理通报

**日期**：2026-06-18
**执行**：Cursor（TASK-617-A 第二阶段）
**审查**：Claude

---

## 做了什么

### 1. 根目录大扫除

- 30 个已结案 TASK 文件 → `docs/tasks/archive/`
- 8 个 cursor/campaign/discussion/audit 讨论稿 → `docs/thinklogs/`
- `design-P1-entry-architecture.md` → `docs/design/`
- 3 个 `dev.db.bak-*` 数据库备份 → 已删除
- `.gitignore` 追加了 `backend/prisma/*.bak*`

### 2. 新建 Cursor 规则体系

```
.cursor/rules/
├── ponytail.mdc                   # Ponytail 写码纪律（上游原样）
├── novel-writer-baseline.mdc      # 分支/暂不做/规则优先级（alwaysApply）
├── novel-writer-frontend.mdc      # React/Vite/Tailwind/Zustand（glob: frontend/**）
├── novel-writer-backend.mdc       # Fastify/Prisma/Zod（glob: backend/**）
└── novel-writer-tasks.mdc         # 任务卡格式/小卡快审（glob: docs/tasks/TASK-*.md）
```

### 3. 新建通用入口

- `AGENTS.md` — Agent 入口地图，指向 CURRENT_BASELINE → CURSOR_REFERENCE → ARCHITECTURE
- `.cursorignore` — 屏蔽 db 备份、归档、大文件

### 4. 规则优先级（硬约束）

- 冲突时：BASELINE > CURSOR_REFERENCE > TASK 卡 > Ponytail
- **测试硬规则**：Ponytail 的"无框架单测"在本项目不适用；统一 Jest + `npm run test:backend`

---

## 对 Codex 的影响

- **找文件路径变了**：旧 TASK 卡在 `docs/tasks/archive/`，讨论稿在 `docs/thinklogs/`
- **Cursor 现在有 Ponytail 纪律约束**：它写代码会更克制（YAGNI → stdlib → native → 已有依赖 → 最小实现），这对 Codex 出的方案是好事——Codex 不用反复叮嘱"别过度工程"
- **Codex 不需要装 Ponytail**：你是参谋长，管架构和方案，Ponytail 是写码刹车，跟你没关系
- **测试建议时注意**：Jest 是硬要求，别推荐 assert demo 或单文件裸跑

---

## 当前状态

- 分支：`feature/workdetail-p1`
- 阶段：休整（无授权新实现卡）
- SSOT：`docs/CURRENT_BASELINE.md`（路径已更新）
