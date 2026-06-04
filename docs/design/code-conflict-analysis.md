# Day 1 代码冲突分析（C-01 ~ C-13）

> 来源：Day 1 设计定案 §10  
> 对照基准：VPS `v2-dev`（2026-06-03）  
> 代码索引：`day1-vps-code-index.md`（修正 ProjectDetailPage 等过时引用）  
> 扩展冲突：C-14~C-19 见 `docs/plan/DAY1-DESIGN-REVIEW-2026-06-03.md`

---

## 冲突点表

| 编号 | 位置 | 类型 | 解决方案 |
|------|------|------|---------|
| C-01 | schema.prisma | 缺 7 时间戳 + writingStyle + deletedAt + proposalId | 加字段 + index |
| C-02 | schema.prisma | Proposal 模型 | **扩展已有模型**（非新建；含 innovation/metadata/references） |
| C-03 | schema status 注释 | 枚举只列 7 值 | 扩 11 值 + 迁移 |
| C-04 | routes/projects.ts | 缺语义化流转端点 | 新建 `routes/transitions.ts` 或重写 transition；替换跨阶段回退 |
| C-05 | routes/projects.ts import | `imported` 保留？ | **待决议**（推荐 A：保留） |
| C-06 | routes/projects.ts | move-to-draft 废弃 | 改名 move-to-planning |
| C-07 | types/metadata.ts:14 | writingStyle 在 JSON | 迁移脚本 + 提顶层 |
| C-08 | services/api.ts | TS 类型 7 值 | 扩 11 值 + 唯一源 |
| C-09 | WorkDetailPage.tsx | 状态字典不完整 | 提 `utils/statusDict.ts` |
| C-10 | WritingEditorPage.tsx | 顶栏多余模式 | 移除 AI/审阅/状态下拉；保留 reference 侧栏（设计允许） |
| C-11 | Layout.tsx | 缺墓园 L1 | 5 阶段 + 🗑️ |
| C-12 | App.tsx | 路由缺 ?from= | searchParams 区分入口 |
| C-13 | AuthGuard.tsx | 绿色横幅 | 合并顶栏（**低优先级**；热修后非阻塞） |

---

## 侦察补充（C-14 ~ C-19）

| 编号 | 说明 |
|------|------|
| C-14 | `projects.ts` ~816 行，transition/shelve 与新区块强耦合 |
| C-15 | TASK-101/102 创意组 Proposal 流 vs Day 1 creating/created **双轨** |
| C-16 | `HomePage` / `dashboard.ts` 按旧 status 聚合 |
| C-17 | `proposals.ts` approve 创建 `Project(draft)` 与 planning/planned 冲突 |
| C-18 | Chapter 三套 status（DB / 规划 / Project written）需统一策略 |
| C-19 | `/shelf` 与墓园 `deletedAt` 并存，须同一里程碑替换 |

---

## 8 步落地顺序

| 步 | 内容 | 依赖 |
|----|------|------|
| **0** | **已交付资产映射表**（创意组 Proposal → Day 1） | — |
| 1 | C-01~03 schema + Proposal 扩展 | 0 |
| 2 | C-07 writingStyle 数据迁移 | 1 |
| 3 | C-04 状态流转端点（禁跨阶段回退） | 1 |
| 4 | C-05~06 imported / move-to-planning | 1 |
| 5 | C-08~09 TS 类型 + 字典 | 3 |
| 6 | C-10 编辑器 pure-ification | 5 |
| 7 | C-11~12 导航 + ?from= | 5 |
| 8 | C-13 AuthGuard UI（可选） | 7 |

**并行**：步 2 与步 3 可部分并行；步 6 与步 7 可部分并行。

**与墓园**：C-11 + TASK-219 须与 C-04 soft-delete **同一里程碑**，并 deprecate `/shelf`。

---

## TASK 映射（约卡数）

| Phase | TASK | 覆盖冲突 | 约卡数 |
|-------|------|----------|--------|
| 1a | 200~209, 209a | C-01~09, 15~17 | 10~12 |
| 1b | 210~220 | C-10~12, 18~19 | 8~10 |

建议里程碑：**M1** 状态机+企划 Tab②③ → **M2** 创作室+编辑器 → **M3** 墓园+总账。
