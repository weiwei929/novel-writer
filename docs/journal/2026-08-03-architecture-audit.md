# 2026-08-03 全仓库架构与代码审计报告

> **状态**：学习记录 · 不作为操作依据（审计结论供司令官决策参考，落地需另行开卡授权）
> **审计人**：参谋长（只读分析，未改任何代码 / 未执行任何 git write）
> **审计基线**：`feature/workdetail-p1` @ `03bb086`
> **参照 SSOT**：AGENTS.md · CURRENT_BASELINE.md · 0608-stage-boundary.md · TASK-720（草案）

---

## 0. 文档治理红旗（先于代码）

| # | 问题 | 证据 |
|---|------|------|
| D1 | **TASK-720 状态自相矛盾**：CURRENT_BASELINE.md:56 宣称「TASK-720 已全线贯通 ✅」，但 TASK-720 任务卡自身状态行为「📋 方案草案 · 待授权 · 创建 2026-08-03」（TASK-720-four-dept-handoff-alignment.md:3），且 git log 无任何 720 提交。按 AGENTS.md 文档采信规则，「待授权」卡不得作为操作依据——但代码里 `HandoffConfirmModal`、`formed` 状态、绿色按钮均已存在（应归 0608/710 战役）。**两文档必有一个状态行失实。** | CURRENT_BASELINE.md:56 vs TASK-720 卡:3 |
| D2 | **基线再次滞后**：CURRENT_BASELINE.md:17 标 HEAD `24bfbef`「ahead 4」，实际 HEAD 已推进至 `03bb086`（+3 提交：710-B 构思笔记、来源卡片、710-W 走查清单），未收录。 | git log |
| D3 | **TASK-720 草案 §3.1 与 0608 规则 4 冲突**：草案授权「打开完工提案时」展示绿色跨部门按钮，0608 §二规则 4 明令详情页不承载跨阶段动作。现状代码同时顺从了两边（详情页有按钮），需司令官裁决以哪份为准。 | TASK-720:58 vs 0608-stage-boundary.md:34 |

---

## 1. 架构与边界防线（State Machine & Boundary）

### ✅ 守得住的部分

- **语义端点白名单完备**：`confirm-greenlight / start-writing / mark-written / submit-review / archive` 均以 `assertStatusFor` 硬卡单一前置状态（projects.ts:806-975），非法跃迁返回 400。
- **stage-guard 桶模型严密**：跨桶硬拒 `CROSS_STAGE_FORBIDDEN`，桶内窄白名单（stage-guard.ts:27-37），`planned→planning` 部门内退回合规（stage-guard.ts:35）。
- **交接幂等**：`applyHandoffTimestamp` 只写一次不覆盖（projects.ts:307-319）；`materializeChapterPlanning` 按 order upsert 幂等（0608 §五已实测）。
- **下游计数防双计**：`workspaceFilters.ts:14-39` 用 `hasReleasedToXxx` 把已交接作品排除出上游工作区，方向正确。
- **无实质死锁点**：事务均短且单库单写；graveyard/shelved 双轨（graveyard.ts:8-11 注释）解耦清晰。

### ❌ 缺口（按严重度）

| # | 级 | 问题 | 证据 |
|---|----|------|------|
| A1 | **P0** | **`PUT /projects/:id` 是状态机后门**：`UpdateProjectSchema.status` 接受 7 值枚举（含 legacy `draft`/`completed`），客户端可一步 `draft→archived`，完全绕过 stage-guard、 readiness 门槛与全部时间戳字段。 | projects.ts:40, 237-246, 1191-1237 |
| A2 | **P0** | **创盘入口不单一（详见 C1）**——`POST /projects` 与 `POST /projects/import` 直建项目并写入禁用别名 `draft`，读映射后静默落入企划课，无提案来源、无 `submittedToPlanningAt`、未经三必一选。 | projects.ts:1174-1188, 420-429; status-migration.ts:13 |
| A3 | **P1** | **企划课无 §7.1 交接留痕展示**：`planned` 列表排除已放行作品后，页面没有任何灰色留痕区——放行即消失。创作室/编审部都有灰卡（WritingProjectsPage.tsx:152-162, EditorialPage.tsx:222-232），**四部门留痕实现不一致**。 | PlanningPage.tsx:36-39, 106-158 |
| A4 | **P1** | **留痕「只读防篡改」未兑现**：`PUT /proposals/:id` 无任何状态守卫，`submitted`/`approved` 提案仍可整改；ProposalDetailPage 保存按钮恒可用。 | proposals.ts:204-222; ProposalDetailPage.tsx:388-395 |
| A5 | **P1** | **留痕时间戳不可信**：三处「已提交 · 日期」均取 `p.updatedAt`（任意后续保存都会漂移），而非后端已持久化的 `_releasedToStudioAt / _releasedToEditorialAt / _releasedToLibraryAt`。 | CreativeWorkspace.tsx:284; WritingProjectsPage.tsx:162; EditorialPage.tsx:232 |
| A6 | **P1** | **创意组交接无持久时间戳**：「提交至企划课」仅 `updateStatus('submitted')`，未写任何 `_submittedToPlanningAt` 类元数据，留痕时间无从锚定。 | ProposalDetailPage.tsx:150-174 |
| A7 | **P1** | **0608 §五裁决未落地**：章节实例化仍发生在 `start-writing`（projects.ts:847-848）而非放行时；`release-to-studio` 只盖时间戳（projects.ts:977-1001）。下游「先看」仍看到 0 章。 | projects.ts:841-872 vs 977-1001 |
| A8 | **P2** | **详情页仍承载跨阶段动作**：「提交至企划课」（ProposalDetailPage.tsx:417-427）与绿色「接收入企划课」（isPlanningRoute，:428-438）均在详情页——0608 §四判定标尺第 4 问答"是"。另见 D3 的规范冲突。 | ProposalDetailPage.tsx:417-438 |
| A9 | **P2** | **Dashboard 双计**：`creative.count` 含 `submitted`（dashboard.ts:179），`planning.count` 经 `isPendingPlanningProposal` 也含同一批 `submitted`（dashboard.ts:112, 184）——同一提案两个部门同时计数，违 §7.1「留痕不参与计数」。 | dashboard.ts:102-112, 179-186 |
| A10 | **P2** | **Proposal 侧无状态机**：`PUT /proposals/:id/status` 在 7 值枚举内任意跃迁，无 `canAccept` 类校验；`PUT /:id` 也可夹带 `status`。项目侧有 stage-guard，提案侧裸奔。 | proposals.ts:224-239, 29 |
| A11 | **P3** | `mark-written` 把全部章节置 `completed`，`undo-written` 只回滚项目状态不回滚章节——退回写作后章节状态失真。 | projects.ts:879-891 vs 931-950 |

---

## 2. 代码健壮性与类型安全

| # | 级 | 问题 | 证据 |
|---|----|------|------|
| B1 | **P0** | **`Proposal.status` 存在四套互相矛盾的字面量词表**：① schema.prisma:258-259 注释（8 值，含 `creating` 无 `formed`）；② constants/statuses.ts:20-32（4 主体含 `creating`/`created` + 4 legacy）；③ proposals.ts:16 zod（7 值，含 `formed` 无 `creating`/`created`）；④ 前端 api.ts:60-68（7 值，含 `formed` 无 `creating`）。**`rejectProposal` 直接写 `'creating'`（proposals.ts:137）——该值不在 zod 枚举也不在前端 `ProposalStatus` 类型里**，被退回提案此后无法经 `PUT /:id/status` 再改状态，前端类型在运行时被越出。 | 见左 |
| B2 | **P1** | **「新写入禁止别名」零执行**：`assertProjectStatusForWrite` / `assertProposalStatusForWrite` 全仓库**无任何调用点**（仅定义于 statuses.ts:55-71）；而 zod 枚举反而放行 legacy 别名写入（projects.ts:40 含 `draft`/`completed`，proposals.ts:16 含 `draft`/`submitted`/`evaluated`/`rejected`）。制度与代码背道而驰。 | statuses.ts:55-71（grep 零调用） |
| B3 | **P1** | **`Chapter.status` 前后端类型断裂**：前端 `'draft' \| 'written'`（api.ts:170）；后端 zod `'draft' \| 'writing' \| 'completed'`（chapters.ts:18），且 `mark-written` 实写 `'completed'`。前端类型中的 `written` 永远不会出现。 | api.ts:170 vs chapters.ts:18 |
| B4 | **P1** | **静默吞没 / 错误伪装**：`catch → 404` 把真实 DB 错误伪装成 Not Found（proposals.ts:219-221, 236-238；projects.ts:1234-1236）；`updateMetadata` 失败 `return {}` 调用方无感（api.ts:568-571, 762）；session 落盘失败仅 warn（sessionStore.ts:21-23）。 | 见左 |
| B5 | **P2** | **竞态**：`accept-into-planning` 的 `projectId/status` 前置检查在事务外（proposals.ts:243-257），并发双击靠 `Project.proposalId @unique`（schema.prisma:71）兜底——第二请求会以 500 + Prisma 原始报错文本泄漏给客户端（proposals.ts:260-262）。单用户场景风险低，但错误处理应收敛为 409/400。前端 `updateMetadata` read-modify-write 有丢更新窗口（api.ts:562-572）。 | 见左 |
| B6 | **P2** | **契约坏死点**：`getImported()` 过滤 `status === 'draft'`（api.ts:552-555），但后端读映射 `draft→planning`，**该方法恒返回空数组**；`moveToDraft`（api.ts:547-550）指向已 410 的端点。两者为死代码。 | api.ts:547-555; projects.ts:565-576 |
| B7 | **P3** | **错误响应结构不统一**：stage-guard 400 返回 `{error: 字符串code, from, to...}`（projects.ts:732-739），其余 400 走 `{success:false, error:{code,message}}`，前端需两套解析。 | projects.ts:732-739 |

**zod 与 api.ts 总体契合度**：release/transition/work-notes/chapter-planning 等主链路方法签名与后端 schema 一一对应（api.ts:587-699 ↔ projects.ts），主链无忧；问题集中在上述边缘点。

---

## 3. 数据一致性与安全性

| # | 级 | 问题 | 证据 |
|---|----|------|------|
| C1 | **P0** | **Single Point of Project Creation 已破**：除 `acceptIntoPlanningCore`（proposals.ts:51）外存在两个直建入口：① `POST /projects`（projects.ts:1174-1188）裸建 `draft`；② `POST /projects/import`（projects.ts:420-429）建 `draft` 且**不写 `_fromImport` 标记**——导致 `move-to-planning` 的 fromImport 检查（projects.ts:771-774）对它们恒 false，而读映射又让它们直接以 `planning` 身份出现在企划课。**导入作品无企划来源、绕过 readiness 门槛，`imported` intake 桶成为死桶。** | 见左 |
| C2 | **P1** | **硬删除端点绕过暂存/墓园纪律**：`DELETE /projects/:id`（projects.ts:1240-1249）与 `DELETE /proposals/:id`（proposals.ts:367-374）物理删除，0608 §7.2「彻底删除属总经理层 + 二次确认」在 API 层无对应摩擦；`Proposal.deletedAt` 字段存在但创意组零入口（0608 §7.3 已自认合规缺口，至今未补）。 | 见左 |
| C3 | **P1** | **登录失败误广播会话过期**：axios 401 拦截器对**所有** 401 清 token + 广播 `novel:auth-expired`（api.ts:33-37），包括 `POST /auth/login` 密码错误的 401（auth.ts:48-53）。AuthGuard 自身不受影响（登录页用独立 error state），但语义错误，任何其他监听者会误判。 | api.ts:33-37 |
| C4 | **P2** | **会话滑动过期持久化滞后**：`isValidSession` 每次请求续期只改内存（sessionStore.ts:86-87），5 分钟才落盘（:91）——崩溃/重启丢失最近续期；`/tmp` POSIX 写死路径（:9）baseline 已录。 | sessionStore.ts:78-91 |
| C5 | **P2** | **AI 冻结仅前端一层**：`AI_UI_FROZEN` 只关 UI（aiFreeze.ts:2），后端 `/api/v2/ai/*` 全活（ai.ts 306 行），`POST /projects/:id/extract-metadata` 还会后台调 `aiService.chat`（projects.ts:603-605, 168-228）。持 token 即可触发计费 API 调用——若定位为「冻结」，后端应加同级开关。 | projects.ts:580-615 |
| C6 | **P3** | CORS `origin: true` 反射任意来源（index.ts:29）；Bearer 方案下风险可控，且已 bind `127.0.0.1`（9110066），建议后续收紧白名单。 | index.ts:28-31 |

**认证解耦评价（正面）**：`AuthGuard` 轮询 `/auth/status` 返回 200 + `authenticated:false` 而非 401（auth.ts:17-29），不会触发拦截器自循环；401 → 清 token → 广播事件 → AuthGuard 监听弹登录（api.ts:33-37 ↔ AuthGuard.tsx:80-90）是干净的单向事件流，无耦合回路。✅

---

## 4. 可维护性与演进建议

### 代码异味清单

| 异味 | 位置 |
|------|------|
| `projects.ts` 1435 行巨石：Markdown 导入校验 + AI 元数据提取 + 13 个流转端点 + 章节规划 + 创作手记，五种职责一个文件 | projects.ts 全文 |
| 路由文件互相导入：`projects.ts:5` 从 `chapters.ts` 导入 `countWords/updateProjectStats`——路由层交叉依赖 | projects.ts:5 |
| 状态词表三处重复定义（见 B1/B2），无单源 | statuses.ts / projects.ts:40 / api.ts:45-68 |
| `appendShelvedMetadata`（projects.ts:291-304）与 `buildShelvedMetadata`（project-transitions.ts:69-81）功能重复 | 见左 |
| 部门解析双轨：`departments.ts`（STATUS_HOME/DOWNSTREAM_OVERRIDE）与 `workspaceFilters.ts` 各讲一套，无 SSOT 声明 | 两文件 |
| `ChapterPlanItem`（api.ts:194-202）与 `ChapterPlanningItem`（api.ts:178-182）双类型并存 | api.ts |
| 死代码：`getImported`、`moveToDraft`、`ProposalEvalPage` 残余类型等 | api.ts:547-555 |

### 高 ROI 改进建议（按投入产出排序）

| 序 | 级 | 建议 | 预估规模 |
|---|---|------|---------|
| 1 | P0 | **摘除 `UpdateProjectSchema.status`**（projects.ts:241），流转只走语义端点——一行 schema 改动堵上最大状态机后门 | 一行 + 回归 |
| 2 | P0 | **直建入口改 `imported`**：`POST /projects` 与 import 写入 `status: 'imported'`（或禁直建），并在 import 时补 `_fromImport` 标记——激活 intake 桶、修复 move-to-planning 自相矛盾、消灭 `draft` 别名新写入 | 小 |
| 3 | P0 | **Proposal 状态词表收敛**：以 `constants/statuses.ts` 为唯一源生成 zod 与前端类型；修正 `rejectProposal` 写 `creating` 造成的悬空状态 | 中 |
| 4 | P1 | **企划课补灰色留痕区** + 三处留痕时间戳改用 `_releasedToXxxAt` + 创意组交接补写 `_submittedToPlanningAt` | 小 |
| 5 | P1 | **提案/项目 PUT 加状态守卫**：`submitted`/`approved` 后内容只读（或仅主管可改），兑现 §7.1 防篡改 | 中 |
| 6 | P1 | **落实 0608 §五**：`materializeChapterPlanning` 移至 `release-to-studio`（幂等已实测，移动安全） | 小 |
| 7 | P1 | **401 拦截器排除 `/auth/login`**，登录失败不再广播 `novel:auth-expired` | 一行 |
| 8 | P2 | 拆 `projects.ts`（import/ai-meta/transition/work-note 四文件）；`departments.ts` 与 `workspaceFilters.ts` 合一；对齐 `Chapter.status` 类型；删 `getImported`/`moveToDraft` | 中 |
| 9 | P2 | 后端 AI 路由加同级冻结开关（读 `AI_UI_FROZEN` 对应 env），未解冻前 `/api/v2/ai/*` 与 `extract-metadata` 返回 503 | 小 |
| 10 | P2 | **文档治理**：裁决 TASK-720 卡状态行 vs baseline 第 56 行；baseline 补录 `4f334d3`/`712a505`/`03bb086`；裁决 D3（详情页按钮以 0608 规则 4 还是 720 草案为准） | 文档 |

> baseline 已录风险（前端零测试、eslint 空规则集、字数三值不一致、session 路径、Monaco 源、死依赖 better-sqlite3/sqlite3、`nul` 事故脚本等）本次复核仍然成立，不重复展开。

---

## 5. 总结论

主链状态机（语义端点 + stage-guard + 幂等交接 + 工作区过滤）的**设计骨架是健康的**，创作室作为基准实现确实立住了。但宪法与代码之间有四条系统性裂缝：

1. **通用更新端点（PUT status）让一切白名单形同虚设**（A1/A10/B2）——后门不堵，前端再守规矩也保证不了边界。
2. **创盘入口不单一**（C1）——import/直建绕过了企划课全部立宪门槛。
3. **§7.1 留痕只实现了「展示」的一半**：企划课无留痕区、时间戳用可变值、内容可篡改（A3-A6、A9）。
4. **状态词表四套并行**（B1）——这是后续一切类型安全与迁移工作的地基，宜最先收敛。

建议优先级：建议 1→2→3（堵后门、正入口、收敛词表）为一批；4→5→6（补齐 §7.1）为一批；其余随战役顺带。

---

# 附：2026-08-03 二次复核（Re-Audit）结论

> 复核范围：A1 后门修复 / A3 企划课灰卡 / 文档状态同步。
> 实测：backend jest **5 suites / 22 tests 全过**（新增 releaseHandoff.test.ts）；frontend `vite build` ✅ 6.14s 零错误。

## A1 — ✅ 已修复（两条尾巴）

- `status` 已从 `UpdateProjectSchema` 摘除，PUT 内映射逻辑同步删除，PUT 不再能改状态。
- 尾巴 1：`PROJECT_STATUSES`（projects.ts:40）成为无引用死常量，应删。
- 尾巴 2：zod 默认 strip 未知键——客户端仍传 `status` 会被静默忽略并返回 200；前端 `projectsApi.update` 类型仍允许传 `status`（api.ts:521-527 + `Project` 接口）。建议 `.strict()` 或清前端类型。
- Proposal 侧同类后门（A10：`PUT /proposals/:id/status` 任意跃迁）仍在，不在本次范围。

## A3 — ✅ 主体修复，§7.1 剩三处未达标（新发现 R1~R3）

- 企划课放行作品不再消失：灰卡只读呈现 ✅，四部门结构同构 ✅。
- **R1**：三页段头计数把留痕混入（`plannedAll/writtenAll/completedAll.length`），且企划课标题数 ≠ 实际渲染卡片数。违 §7.1「段头计数需分列（已完成 2 部 · 已交接 3 部）」。
- **R2**：三页 `total` 均含留痕，下游工作区亦计入 → 页头统计跨部门双计。违 §7.1「一律不参与任何聚合」。
- **R3**：编审灰卡标签「已归档文集库」失实——release-to-library 只是提交待归库，归档是文集库自身 `archive` 动作（projects.ts:953-975）。应统一为「已提交文集库」。
- 旧账未清（不在本次范围）：灰卡时间戳仍用 `updatedAt` 而非 `_releasedToXxxAt`。

## 文档同步 — ⚠️ 状态行已对齐，但代码未提交

- TASK-720 状态行、baseline 日期/HEAD 均已更新 ✅。
- **全部修复尚在工作区未 commit**：13 modified + 13 deleted + HandoffConfirmModal 等 untracked。720「已贯通」无任何 commit 承载，违 AGENTS.md「push 有意义的分支」纪律，且有 2026-07-25 `nul` 事故（未提交工作疑似丢失）前科。**建议立即 commit + push。**
- D3（720 卡 §3.1 详情页按钮 vs 0608 规则 4）仍未裁决，详情页跨部门按钮仍在。
