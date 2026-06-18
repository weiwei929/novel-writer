# TASK-617-A：Cursor 工作区自优化

- **状态**: ⏳ 待执行
- **架构师**: Claude（出题）
- **操作员**: Cursor Agent（自主执行）
- **审查员**: Claude（事后检查）
- **创建日期**: 2026-06-18
- **前置任务**: 无（休整期，无需依赖任何战役）

---

## 背景

Cursor 此前对 `novel-writer` 仓库做了一次诊断，提出了 7 条优化建议。其中前三条（`.cursor/rules/`、`AGENTS.md`、`.cursorignore` + 工作区整理）被判定为"低成本、最高收益"。

在执行这些优化之前，有一个前置问题值得 Cursor 自己探究：**GitHub 上有一个叫 Ponytail 的 Prompt Engineering 规则集（DietrichGebert/ponytail，32k+ stars），专门让 AI 编码助手写更少但更好的代码。** Cursor 应该自己去找它、理解它，然后判断——这个项目该不该用？怎么用？

---

## 第一阶段：Ponytail 调研与提案

> 目标：Cursor **独立**完成调研，输出一份简短的提案。不执行。

### 操作步骤

1. **找到 Ponytail**
   - 搜索或直接访问 `https://github.com/DietrichGebert/ponytail`
   - 阅读 README、AGENTS.md、核心规则文件

2. **理解它的机制**
   - 它怎么工作？（不是"它做什么"，是"它怎么做到"）
   - 决策阶梯是什么？
   - 三种强度模式（lite / full / ultra）的区别？
   - 在 Cursor 中如何集成？（提示：看 `.cursor/rules/ponytail.mdc`）

3. **回答三个问题，输出到 `docs/thinklogs/ponytail-evaluation.md`**：

   ```markdown
   # Ponytail 评估 — novel-writer 适用性分析

   ## Q1: 这个项目该不该用 Ponytail？
   - 判断依据：项目当前阶段（休整期）、技术栈复杂度、单人开发
   - 给出明确结论：用 / 不用 / 部分场景用

   ## Q2: 如果要用，什么强度？什么场景开关？
   - 日常开发用什么模式？
   - 什么情况下应该关掉？
   - 和已有的 CURSOR_REFERENCE.md 规范会不会冲突？

   ## Q3: 具体怎么集成？
   - 文件放哪里？
   - alwaysApply 设 true 还是按 glob 匹配？
   - 是否需要在 AGENTS.md 中提及？
   ```

4. **不要执行 Ponytail 的安装或文件创建**——只输出提案。等 Claude 和用户审查决定。

---

## 第二阶段：工作区优化（建议一～三）

> 前置：第一阶段提案经审查通过后执行。Ponytail 是否集成、以什么方式集成，取决于审查结果。

### 操作步骤

#### 1. 工作区整理

```bash
# 在项目根目录执行

# a) 归档已结案的 TASK 文件 → docs/tasks/archive/
#    判断标准：git status 显示为 ??（未跟踪），且内容描述的任务已合并/结案
#    TASK-p0-*, TASK-p1-*, TASK-p2-*, TASK-p3*, TASK-p4*, TASK-pipeline-*,
#    TASK-closure-*, TASK-commit-*, TASK-creative-*, TASK-entry-*, TASK-fact-*
#    都应在归档范围内

# b) cursor-*.md / campaign-*.md / discussion-*.md / audit-*.md
#    → docs/thinklogs/（讨论/审计稿）
#    或 docs/archive/（已失效的历史记录）

# c) backend/prisma/dev.db.bak-*
#    确认 .gitignore 覆盖（*.bak 已存在但不匹配 *.bak-YYYYMMDD 后缀）
#    如需保留 → 移到项目外
#    如不需保留 → 删除
#    同时更新 .gitignore 显式添加 backend/prisma/*.bak*

# d) design-P1-entry-architecture.md（根目录那个）
#    → docs/design/（与其他设计文档放在一起）
```

#### 2. 创建 `.cursor/rules/`

从现有文档提炼，不发明新内容：

| 规则文件 | 来源 | alwaysApply | 内容要点 |
|----------|------|-------------|----------|
| `.cursor/rules/novel-writer-baseline.mdc` | `docs/CURRENT_BASELINE.md` | `true` | 当前分支、已合并战役、暂不做清单、推荐下一战 |
| `.cursor/rules/novel-writer-frontend.mdc` | `docs/tasks/CURSOR_REFERENCE.md` | `glob: frontend/**/*` | React 18 + Vite + Tailwind + Zustand + Monaco，路由 `/work/:id` |
| `.cursor/rules/novel-writer-backend.mdc` | `docs/tasks/CURSOR_REFERENCE.md` | `glob: backend/**/*` | Fastify 5 + Prisma 6 + SQLite + Zod，API 约定 |
| `.cursor/rules/novel-writer-tasks.mdc` | `docs/tasks/TEMPLATE.md` + `docs/tasks/README.md` | `glob: docs/tasks/TASK-*.md` | 任务卡格式、验收标准、小卡快审原则 |

> ⚠️ 规则内容要精简。每条规则控制在 30 行以内。目标是让 Agent 少问重复问题，不是把整份 CURSOR_REFERENCE.md（20KB）塞进去。

#### 3. 创建 `AGENTS.md`

放在项目根目录，作为 Agent 的入口地图：

```markdown
# AGENTS.md — Agent 入口

## 先读这些

1. [CURRENT_BASELINE.md](docs/CURRENT_BASELINE.md) — 当前做到哪了、暂不做
2. [CURSOR_REFERENCE.md](docs/tasks/CURSOR_REFERENCE.md) — 编码规范
3. [ARCHITECTURE.md](docs/ARCHITECTURE.md) — 系统架构

## 开任务卡之前

- 读 CURRENT_BASELINE.md 的「暂不做」清单
- 任务卡放在 docs/tasks/，用 TASK-NNN-描述.md 命名
- 模板：docs/tasks/TEMPLATE.md

## 提交之前

- `npm run lint` 通过
- `npm run test:backend` 通过
- `npm run build` 通过
```

#### 4. 创建 `.cursorignore`

```
# 数据库备份
backend/prisma/*.bak*

# 归档（避免 Agent 读到过期任务卡）
docs/archive/
docs/tasks/archive/

# 临时文件
*.tmp
.cache/

# 大文件
*.mp4
*.mov
```

---

## 预期结果

**第一阶段**：
- `docs/thinklogs/ponytail-evaluation.md` 存在，三个问题有明确答案
- Ponytail 是集成还是不集成，有清晰论据

**第二阶段**：
- 根目录干净：`git status` 不再显示散落的 TASK/cursor 文件
- `.cursor/rules/` 下有 5 个 `.mdc` 文件（Ponytail + 4 条项目规则）
- `AGENTS.md` 在根目录
- `.cursorignore` 在根目录
- `.gitignore` 追加了 `backend/prisma/*.bak*`
- `npm run build` 仍然通过（未改动任何业务代码）

---

## 验证方法

```bash
# 1. 根目录干净度
git status --short
# 预期：不再有根目录 TASK-*.md / cursor-*.md / audit-*.md

# 2. 新文件存在
ls .cursor/rules/
ls AGENTS.md .cursorignore
ls docs/thinklogs/ponytail-evaluation.md

# 3. 构建未破坏
npm run build
# 预期：通过

# 4. 后端测试未破坏
npm run test:backend
# 预期：通过
```

---

## 回滚方案

```bash
# 删除新增文件
rm -rf .cursor/rules/
rm AGENTS.md .cursorignore

# 恢复归档的文件（从 docs/tasks/archive/ 或 docs/thinklogs/ 移回根目录）
# git checkout 可恢复已跟踪文件
```

---

## 关联

- 基线：[CURRENT_BASELINE.md](../CURRENT_BASELINE.md)
- Cursor 诊断提案（2026-06-18，7 条建议）
- CURSOR_REFERENCE.md：[../tasks/CURSOR_REFERENCE.md](../tasks/CURSOR_REFERENCE.md)
- Ponytail：https://github.com/DietrichGebert/ponytail
