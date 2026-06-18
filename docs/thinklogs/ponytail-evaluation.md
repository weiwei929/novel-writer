# Ponytail 评估 — novel-writer 适用性分析

> **调研日期**：2026-06-18
> **任务卡**：`docs/tasks/TASK-617-A-cursor-self-optimize.md`（第一阶段）
> **调研方式**：独立搜索 GitHub，阅读上游 README、`AGENTS.md`、`.cursor/rules/ponytail.mdc`、`skills/ponytail/SKILL.md`、`docs/agent-portability.md`
> **约束**：本阶段仅输出提案，未安装任何 Ponytail 文件

---

## 调研摘要：Ponytail 是什么、怎么工作

### 仓库定位

- **仓库**：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)（GitHub 上高 star 的 AI 编码规则集）
- **目标**：让 AI 编码助手在动手前先做「必要性判断」，写出**更少但够用**的代码，而不是默认堆抽象、加依赖、铺脚手架
- **口号**：「Lazy means efficient, not careless」——懒是高效，不是马虎

### 核心机制：决策阶梯（The Ladder）

Ponytail 不是 lint 工具，也不是 pre-commit hook；它通过**每轮对话注入的系统指令**，在写代码前强制 Agent 逐级停住，**停在第一个能解决问题的梯级**：

```
1. 这东西需要存在吗？        → 不需要就跳过（YAGNI）
2. 标准库能做吗？            → 用标准库
3. 平台原生能力能做吗？      → 用原生（如 <input type="date">、CSS、DB constraint）
4. 已安装的依赖能解决吗？    → 用现有依赖，不为小事加新包
5. 能一行搞定吗？            → 一行
6. 只有上面都不行时         → 写满足需求的最小代码
```

配套行为规则包括：不建未请求的抽象、删除优于添加、刻意简化用 `ponytail:` 注释标注天花板与升级路径；**但在信任边界校验、防数据丢失的错误处理、安全、无障碍、用户明确要求的功能上不许偷懒**。

### 三种强度模式（lite / full / ultra）

| 模式 | 行为 | 示例（「给 API 响应加缓存」） |
|------|------|------------------------------|
| **lite** | 按用户要求做，但**一句话点出更懒的替代方案**，让用户选 | 做了缓存类，并提示 `lru_cache` 一行可替代 |
| **full**（默认） | **强制执行阶梯**，最短 diff、最短解释 | 直接 `@lru_cache`，跳过自建 cache class |
| **ultra** | YAGNI 极端派，**先质疑需求本身**，倾向删代码 | 「先 profiling 再谈缓存；手搓 TTL cache 是 bug 农场」 |

模式切换在 Claude Code / Codex / OpenCode 等**带 plugin + hooks 的宿主**里通过 `/ponytail lite|full|ultra|off` 动态切换；也可用 `PONYTAIL_DEFAULT_MODE` 或 `~/.config/ponytail/config.json` 设默认。

### 在 Cursor 里怎么集成

根据上游 `docs/agent-portability.md`：

| 宿主类型 | Cursor 属于 |
|----------|-------------|
| **Full plugin**（hooks、模式切换、commands） | ❌ 不属于 |
| **Instruction-only adapter**（静态规则文件） | ✅ 属于 |

**Cursor 集成方式**：把 `.cursor/rules/ponytail.mdc` 复制到项目的 `.cursor/rules/` 目录。

该文件 frontmatter 为：

```yaml
description: Ponytail, lazy senior dev mode...
globs:
alwaysApply: true
```

即：**全局、每会话始终生效**。Cursor **没有** `/ponytail-review`、`/ponytail-audit` 等命令，也**无法**在会话中切换 lite/full/ultra——装上的就是 `ponytail.mdc` 里那份等价于 **full** 的紧凑规则。

---

## Q1: 这个项目该不该用 Ponytail？

### 判断依据

| 维度 | novel-writer 现状 | 对 Ponytail 的启示 |
|------|-------------------|-------------------|
| **项目阶段** | `CURRENT_BASELINE.md`：616-D 已收束，**休整期**，无授权新实现 | 现在适合配环境、写规则；不适合 ultra 式「质疑一切需求」 |
| **技术栈复杂度** | 双端（Vite/React + Fastify/Prisma）、五部门导航、`/work/:id` 阶段机、metadata 宪法、AI 双层架构 | 领域规则多，**不能**只靠通用 YAGNI；Agent 必须读项目 SSOT |
| **协作模式** | 轻量战役制、小卡快审、任务卡驱动 | 与 Ponytail「最小 diff」高度一致 |
| **开发人力** | 单人 + AI（架构师 Claude / 操作员 Cursor） | Ponytail 可抑制 Agent 过度工程，降低 review 成本 |
| **已有约束** | 用户级 Cursor rules 已含「最小范围、不过度抽象」；`CURSOR_REFERENCE.md` 有路由/阶段/AI 克制等硬约定 | 与 Ponytail **大量重叠**；缺的是**项目级** `.cursor/rules/`，不是再叠一层通用懒哲学 |

### 结论：**部分场景用**

**不建议**把 Ponytail 当作 novel-writer 的**唯一**或**最高优先级**规则——会与本项目的架构 SSOT、任务卡授权、暂不做清单冲突。

**建议**在以下场景启用 Ponytail 精神（或直接装 `ponytail.mdc`）：

- 日常小卡实现（修 bug、补字段、单路由调整）
- 工作区整理、配置类任务（如 TASK-617-A 第二阶段）
- Agent 开始「顺手重构」「加一层 abstraction」时

**不建议**依赖 Ponytail 单独驱动的场景：

- 读 `docs/design/` 立宪文档做架构决策
- 执行已写明文件清单与验收标准的 TASK 卡（任务卡本身就是授权，不能被 YAGNI 掉）
- 涉及 metadata 宪法、阶段机、`start-writing` materialize 等**已设计好的多文件链路**
- 休整期以外未授权的新功能探索

**一句话**：Ponytail 适合当「写代码时的刹车」，不适合当「项目宪法」。

---

## Q2: 如果要用，什么强度？什么场景开关？

### 日常开发用什么模式？

| 模式 | Cursor 能否用 | 建议 |
|------|---------------|------|
| **lite** | ❌ 无动态切换；需手动在 prompt 里说「先给更懒方案让我选」 | 做**探索性/不确定**任务时，在任务卡里写一句即可模拟 |
| **full** | ✅ `ponytail.mdc` 默认即此强度 | **推荐作为 Cursor 唯一安装形态** |
| **ultra** | ⚠️ 仅能通过改 mdc 文本模拟 | **不推荐**用于 novel-writer；易与任务卡、设计文档对抗 |

**推荐默认**：安装上游 `ponytail.mdc`（等价 full），配合项目自己的 `novel-writer-baseline.mdc` 设优先级。

### 什么情况下应该关掉？

在 prompt 或任务卡里显式写以下任一即可（Ponytail 自身支持「stop ponytail / normal mode」）：

1. **执行已授权任务卡**且步骤已写死（如 TASK-616-D 类战役）
2. **跨前后端、多文件**的闭环功能（企划→创作室主链已证明需要协调改动）
3. **读设计文档做对齐**，而非写实现代码
4. Agent 反复「质疑需求」导致无法完成卡上列出的 `npm run build` / `test:backend` 验收
5. 本仓库 **`暂不做`** 清单相关话题——应直接拒绝，而不是用 Ponytail 去「简化实现」

### 和 CURSOR_REFERENCE.md 会不会冲突？

| 领域 | 潜在冲突 | 化解方式 |
|------|----------|----------|
| **路由 `/work/:id` 中枢** | Ponytail 可能建议「合并页面、少文件」 | baseline 规则写明：路由结构以 CURSOR_REFERENCE 为准 |
| **Zustand / 现有 api.ts 模式** | Ponytail 反对未请求的新抽象 | 一致；CURSOR_REFERENCE 要求复用现有模式 |
| **AI 功能** | ultra 可能质疑「这 AI 面板必要吗」 | 设计文档已定义双层架构；任务卡授权前不许删 |
| **测试** | Ponytail：非平凡逻辑留一个最小 runnable check，「no frameworks」 | 与项目 `npm run test:backend`（Jest）**表面冲突** | baseline/AGENTS.md 写明：**项目验证以 npm scripts 为准**，Ponytail 的「无框架单测」不覆盖本仓库 |
| **编辑器范围** | Ponytail 倾向原生 | Monaco 是项目明确选型，属「explicitly requested」 |
| **用户中文 UI** | 无冲突 | Ponytail 管代码量，不管文案语言 |

**结论**：冲突可控，但必须在 `novel-writer-baseline.mdc` 里写一句 **「当 Ponytail 与 CURRENT_BASELINE / CURSOR_REFERENCE / 当前 TASK 卡冲突时，以后三者为准」**。

---

## Q3: 具体怎么集成？

### 文件放哪里？

```
novel-writer/
├── AGENTS.md                          # 第二阶段创建；入口地图
├── .cursorignore                      # 第二阶段创建
└── .cursor/
    └── rules/
        ├── ponytail.mdc               # 从上游复制（若审查通过）
        ├── novel-writer-baseline.mdc    # alwaysApply: true，优先级高于 ponytail
        ├── novel-writer-frontend.mdc  # glob: frontend/**/*
        ├── novel-writer-backend.mdc   # glob: backend/**/*
        └── novel-writer-tasks.mdc     # glob: docs/tasks/TASK-*.md
```

**加载顺序建议**（逻辑优先级，非 Cursor 官方 API）：

1. `novel-writer-baseline.mdc` — 分支、暂不做、权威文档指针、**覆盖条款**
2. `novel-writer-{frontend,backend,tasks}.mdc` — 按 glob 生效的领域规则
3. `ponytail.mdc` — 通用写码纪律

### alwaysApply 设 true 还是按 glob 匹配？

| 文件 | alwaysApply | 理由 |
|------|-------------|------|
| `ponytail.mdc` | **true**（保持上游默认） | 上游如此设计；full 模式需每轮生效 |
| `novel-writer-baseline.mdc` | **true** | 休整期/暂不做必须随时可见 |
| frontend/backend/tasks | **false** + glob | 避免无关对话浪费 context |

**备选方案**（若审查担心 context 过长）：`ponytail.mdc` 改 `alwaysApply: false` + `globs: "{frontend,backend}/**/*"`，仅在写代码时生效——但会弱化「先问要不要做」的 YAGNI 梯级；**更推荐 alwaysApply + 精简其他规则各 ≤30 行**（TASK-617-A 第二阶段已要求）。

### 是否需要在 AGENTS.md 中提及？

**需要**，简短即可，例如：

```markdown
## 写码纪律

- 默认启用 [Ponytail](https://github.com/DietrichGebert/ponytail)（`.cursor/rules/ponytail.mdc`）
- 与 `CURRENT_BASELINE.md`、`CURSOR_REFERENCE.md`、当前 TASK 卡冲突时，以项目文档为准
- 执行已授权任务卡时说「按任务卡执行，normal mode」可暂时抑制过度 YAGNI
- Cursor 不支持 `/ponytail-review`；需要时用 prompt：「按 Ponytail 标准 review 当前 diff」
```

### 安装步骤（审查通过后执行，本阶段未做）

```bash
# 仅复制一个文件，无 npm 依赖
mkdir -p .cursor/rules
curl -o .cursor/rules/ponytail.mdc \
  https://raw.githubusercontent.com/DietrichGebert/ponytail/main/.cursor/rules/ponytail.mdc
```

无需改 package.json，不影响 `npm run build`。

### 审查门建议（供你我讨论）

| 选项 | 说明 |
|------|------|
| **A. 装 full ponytail.mdc + 4 条项目规则** | 推荐；Ponytail 管通用纪律，baseline 管项目边界 |
| **B. 不装 ponytail.mdc，只把阶梯写进 baseline 一条** | 若担心规则重复；用户 global rules 已有类似内容 |
| **C. 仅手动 prompt 启用** | 最轻，但不可持续、新会话易忘 |

---

## 附录：调研路径记录

1. 搜索关键词 `Ponytail Cursor rules ponytail.mdc github` → 定位 `DietrichGebert/ponytail`
2. 阅读 README → 确认决策阶梯、lite/full/ultra、Cursor 属于 instruction-only 适配器
3. 阅读 `.cursor/rules/ponytail.mdc` → 确认 `alwaysApply: true` 与 full 规则正文
4. 阅读 `skills/ponytail/SKILL.md` → 确认三档强度差异与 Cursor 无 `/ponytail` 命令
5. 阅读 `docs/agent-portability.md` → 确认各宿主集成方式
6. 对照 `docs/CURRENT_BASELINE.md`、`docs/tasks/CURSOR_REFERENCE.md` → 评估冲突与优先级

---

**第一阶段交付物**：本文档。等待审查门决定后，再执行 TASK-617-A 第二阶段（工作区整理 + `.cursor/rules/` + `AGENTS.md` + `.cursorignore`）。
