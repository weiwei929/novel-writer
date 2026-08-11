# Novel Writer — 当前基线

> **状态**：现役 · 单一真相源（SSOT）· 最后核对 **2026-08-11**
>
> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。
> 项目整体方向与去向见 [ROADMAP.md](./ROADMAP.md)（含 **§八 0728 共识速查**，防漂移条款）。

**最后更新**：2026-08-11（PR #16 合并；Wave6 获准产品集成 @ `ac9a3af` 已进入 `master`）

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `master` |
| **已验证产品集成点** | `ac9a3af`（2026-08-11，PR #16 merge commit） |
| **上一工程基线** | `b60eaf8`（标签 `baseline-2026-08-07`） |
| **上一实测基线** | `0e99c14`（2026-07-25 司令官本机全链路实测通过） |
| **协作档位** | 轻量战役制 · **小卡快审 / 低风险快合** |
| **协作模式** | 司令官拍板 → **参谋长出卡/审卡** → Cursor 侦察与实施 → 参谋长核验收 |

> 正式开发与部署源统一为 `master`。`ac9a3af` 是 2026-08-11 已验证的产品集成提交，**不等于**永久 HEAD SSOT——开工以当前 `origin/master` 为准。远端正式分支当前仅保留 `master`。

---

## 已合并战役

| 战役 | 摘要 |
|------|------|
| **616-B** | 设定侧闭环 — [TASK-616-B-closure.md](./tasks/archive/TASK-616-B-closure.md) |
| **P1 入口治理** | **暂收束**（不做 P1-c） |
| ↳ P1-a | PR [#7](https://github.com/weiwei929/novel-writer/pull/7) 创意组裸链 → 企划课承接 |
| ↳ P1-b | PR [#8](https://github.com/weiwei929/novel-writer/pull/8) ShelfPage / ProjectCard `?from=` 治理 |
| **616-C** | 章节规划侧闭环（企划课） |
| ↳ C-A | PR [#9](https://github.com/weiwei929/novel-writer/pull/9) · [TASK-616-C-A.md](./tasks/archive/TASK-616-C-A.md) |
| ↳ C-A2 | PR [#10](https://github.com/weiwei929/novel-writer/pull/10) · [TASK-616-C-A2.md](./tasks/archive/TASK-616-C-A2.md) |
| **616-D** | 企划 → 创作室交接（**主链已贯通**） |
| ↳ D-A | PR [#11](https://github.com/weiwei929/novel-writer/pull/11) · [TASK-616-D-A.md](./tasks/archive/TASK-616-D-A.md) start-writing materialize |
| ↳ D-B | PR [#12](https://github.com/weiwei929/novel-writer/pull/12) · [TASK-616-D-B.md](./tasks/archive/TASK-616-D-B.md) 创作室只读参考（设定 / 本章） |
| ↳ D-C | PR [#13](https://github.com/weiwei929/novel-writer/pull/13) 写作器入口可用性（作品详情 + 创作室列表 → 自动进写作器） |
| ↳ D-D | PR [#14](https://github.com/weiwei929/novel-writer/pull/14) 写作参考侧栏 legacy 降噪（一级 Tab 仅设定 / 本章） |
| **quick-writing** | [TASK-618-quick-writing-loop.md](./tasks/archive/TASK-618-quick-writing-loop.md) · HomePage「继续写作」入口与保存可靠性解耦 |
| **draft-recovery** | [TASK-619-draft-recovery-offline-guard.md](./tasks/archive/TASK-619-draft-recovery-offline-guard.md) · 创作室本地草稿自动镜像与一键恢复横幅 |
| **chapter-origin-flow** | [TASK-620-chapter-origin-flow-alignment.md](./tasks/archive/TASK-620-chapter-origin-flow-alignment.md) · 三大第一起点全盘对齐与 616 战役封版 |
| **release gate** | commit `43b9c24` — `backend` `build` / `lint` 前置 `prisma generate` |
| **studio-layout** | commit `0e99c14` — `WorkMetadataPanel` → `WorkSettingDocument`；抽出 `CreateProposalModal`；删除 `ProposalEvalPage`；**修复写作器底部状态栏缺失**（+562 / −693） |
| **TASK-700 阶段一** | v2.7.27 管线打通 · 队列见 [TASK-700-EXEC-queue.md](./tasks/TASK-700-EXEC-queue.md) |
| ↳ 700-B | `d9cc4ad` WorkDetail 企划放行错接线 |
| ↳ 700-C | `4a5ad52` ReviewDetail「标记已审」假提示 |
| ↳ 700-D | `316350a` 详情补提交编审 + 删 `StudioActions` |
| ↳ 700-E | `c2453e9` 路由 `/creative/chat` → `/creative/workspace`，删 `ChatPage`（12 行占位） |
| ↳ 700-F | `c52d00c` **创作手记 · 后端记录层**（`WorkNote` 表 + `recordWorkNoteDiff`） |
| ↳ 700-G | `66d7415` 创作手记 · 编审部右栏呈现层 |
| ↳ 700-H | **已作废**——三栏与防撞车部分否决，保留部分转入 710-D（见 [TASK-710](./tasks/TASK-710-creative-seed-chain.md) §三） |
| **Wave6 / PR #16** | PR [#16](https://github.com/weiwei929/novel-writer/pull/16) @ `ac9a3af` · formed 服务端门禁、五处 HandoffConfirmModal 接线、attachedReferences、阶段「已完成」统计含 released |
| **TASK-710 种子链** | 创意组补断链 · 计划见 [TASK-710](./tasks/TASK-710-creative-seed-chain.md)。710-A 及 Wave6 获准范围已并入 master（PR #16）；710-B/C/E/F 按任务文档另行治理 |
| **TASK-720 部门对齐** | **四大生产部门流转与权责对齐** · [TASK-720](./tasks/TASK-720-four-dept-handoff-alignment.md)。Wave6 获准范围已并入 master（PR #16）；完整方案见任务文档，剩余事项另行治理 |

0608 五部门骨架、616-A 命名/梗概等见历史封版记录。

### 新增数据模型（700-F）

| 表 | 用途 |
|---|---|
| `WorkNote` | **创作手记**。`projectId / field / content / note / kind / recordedAt`。tracked 七字段：`origin` `synopsis` 四块设定 `chapterPlanning`。`kind`：`edit` = 真实变更时刻，`initial` = 上线补拍（`recordedAt` 不可信） |

**呈现位置**：目前**仅** `ReviewDetailPage` 右栏。作品详情页无入口——归位待办。

**企划 → 创作室主链（已贯通）：**

```text
_settingSketch → workSetting + chapterPlanning
  → confirm（B 三必 + C 最低章节）
  → release-to-studio → start-writing（materialize → chapters）
  → 写作器：入口（D-C）+ 参考侧栏设定/本章（D-B/D-D）+ 正文保存
```

| 阶段 | SSOT / 载体 |
|------|-------------|
| 企划课设定 | `metadata.workSetting` |
| 企划课章节规划 | `metadata.chapterPlanning` |
| 创作室章节/正文 | `chapters` 表（D-A materialize 后） |
| 创作室参考（主） | `workSetting` + `Chapter.summary`（D-B / D-D 只读） |
| 创作室参考（legacy） | `Character` / `TimelineEntry` / `CreativeFlow` 表 → 折叠「遗留参考」（D-D） |

---

## 当前状态判断

- **616-D 主链人工 smoke 已通过**（作品详情入口、列表入口、正文保存、侧栏参考）
- **2.0 主骨架初步成型**（五部门导航、WorkDetail 中枢、创作室编辑器、616 内容主链）
- **`0e99c14` 已作为新基线验收** —— 布局修复肉眼确认，后续完善从这里开始

### 2026-07-25 全链路实测结果

在本机（Windows / PowerShell）实跑，非推断：

| 检查项 | 结果 |
|--------|------|
| `backend npm run lint`（真跑 `tsc --noEmit`） | ✅ 通过 |
| `backend npm test` | ✅ **4 suites / 16 tests 全通过**（3.7s） |
| `frontend npm run lint` | ✅ 通过（但规则集近乎空，见风险表） |
| `frontend npm run build` | ✅ 通过（363 模块 / 3.63s） |
| 后端启动 | ✅ `Server running on http://localhost:5000` |
| `GET /health` | ✅ `{"status":"ok","database":"connected"}` |
| `GET /api/v2/projects`（无 token） | ✅ **401**，全局鉴权中间件确实拦截 |
| 企划 → 创作室主链（浏览器实走） | ✅ 设定 / 章节 / 正文 / 只读参阅四层均在，真实内容 |

**构建产物对比（基线 `5b2e426` → 新基线 `0e99c14`）：**

| 产物 | 前 | 后 |
|------|----|----|
| 模块数 | 366 | 363 |
| `WorkDetailPage` | 43.02 kB | **34.21 kB（−20%）** |
| `ProposalEvalPage` | 3.85 kB | 已消失（删除干净，无悬挂引用） |
| 主包 `index.js` | 316.88 kB | 316.70 kB |

结论：这次重构是**拆解**而非搬运——巨石文件变小，总量未增，`tsc -b` 通过证明删除已彻底传导。

---

## 已知风险

> ~~空测试~~ 一条已作废：后端现有 4 suites / 16 tests 真实通过，不再是占位。

| 风险 | 严重度 | 说明 |
|------|--------|------|
| ~~服务暴露在局域网~~ | ✅ **已修** | 2026-07-28 `9110066` 改 `127.0.0.1`。实测外部设备连接被拒 |
| ~~默认密码硬编码~~ | — | **不是风险，是有意选择。**司令官 2026-07-28 拍板：开发阶段沿用 `novel2024`，上线前再议。**后来的 Agent 不要自作主张加固**，见 [ROADMAP §八 第 9 条](./ROADMAP.md) |
| **两份 `.env` 并存** | 低 | 仓库根与 `backend/` 各一份，仅后者含 `APP_PASSWORD`（现已按上条移除）。`24bfbef` 起 `backend/.env` 会被完整载入 `process.env`（含 `GEMINI_API_KEY`）。运行时 cwd 在 `backend/`，以该份为准 |
| **前端零测试** | 高 | 16 个用例全在 `backend/src/services/`。`0e99c14` 改了 15 个文件、其中 14 个是前端，**四条绿灯没有一条在验它**，只能肉眼验收 |
| **eslint 规则集近乎空** | 中 | `eslint.config.js` 未启用 `@typescript-eslint` 推荐集；`no-explicit-any` 未启用（前端 55 处 `: any` 不可见）；`no-unused-vars`、`react-hooks/exhaustive-deps` 均为 `off`。`--max-warnings 0` 因此恒绿，形同摆设 |
| ↳ `exhaustive-deps` 关闭 | 中 | 该规则专抓 stale closure，正是 autosave / 草稿恢复的高发缺陷区（618/619 两战的战场），目前无自动防线 |
| **字数统计三值不一致** | 中 | 同一章：标题栏 `190 字` / 底栏 `字符数 1,914` / `词数 55`。`wordCount` 疑为写入快照未回填；`词数` 按空白切分，对中文无意义。章节列表 `0字` 同源 |
| **session 路径 POSIX 写死** | 中 | `sessionStore.ts` 默认 `/tmp/novel-writer-sessions.json`，Windows 上落到盘符根，写失败被 `catch` 静默吞掉 → 后端每次重启（nodemon 每改一次代码）登录态清空 |
| Monaco 加载源未定 | 待验证 | 产物中无 Monaco chunk，`@monaco-editor/react` 默认从 `cdn.jsdelivr.net` 运行时加载且未见 `loader.config`。若属实，README「离线可用」不成立。**验法**：F12 → Network → 开写作器 → 搜 `jsdelivr` |
| 依赖冗余 | 低 | `better-sqlite3` / `sqlite3` 在 `backend/src`、`backend/scripts` 中零引用，纯死依赖且需本地编译 |
| CSS minify warning | 低 | `-: T;` 畸形声明，疑为 Tailwind `content` 扫描 `.ts` 源码时误把泛型 `<T>` 当类名候选。与业务无关，但长期存在会训练团队忽略所有告警 |
| Prisma 双配置 | 低 | `package.json#prisma` 与 `prisma.config.ts` 并存，每次 generate 打两条 deprecation warn；`npm run generate` 里的 `dotenv({path:'.env.example'})` hack 已失效（Prisma 自报 skipping env loading） |
| 版本号三处不一 | 低 | `/health` 报 `2.0.0-alpha`、`VERSION.json` 写 `2.0.0`、README 写 `2.0` |
| Windows DLL 锁 | 低 | `npm run build` / `lint` 会触发 `prisma generate`；backend dev 运行时可能锁 `query_engine-windows.dll.node`，需先停 dev |
| **根 `package.json` clean 脚本混用 cmd 语法** | 中 | `"clean"` 里的 `rmdir /s /q` 与 `2>nul` 是 cmd 写法。在 PowerShell 下执行会**真的创建一个名为 `nul` 的文件**（Windows 保留设备名，常规 API 删不掉）。<br>**已发生实际事故（2026-07-25）**：该文件导致 `git stash push -u` 收尾时死循环，中断后工作区进入「untracked 已移除、tracked 未回滚」的不一致状态，几小时未提交的重构一度疑似丢失。<br>删法：`cmd /c 'del "\\?\<绝对路径>\nul"'`。根治：改脚本 + `.gitignore` 加 `nul` |
| legacy 数据层 | 中 | 人物 / 故事线 / 心流表与 legacy metadata 未清理，仅 UI 降噪 |

---

## 当前推荐下一战

**战果归档 / 休整** — 616-D 与 Wave6 获准范围已收束；无授权新实现卡前不主动开战役。

TASK-710/720 **未全部完成**；本次 PR #16 仅合入 Wave6 获准范围。710-B/C/E/F 等剩余事项按 [TASK-710](./tasks/TASK-710-creative-seed-chain.md) 任务文档另行治理，需司令官授权后开卡。

| 序 | 卡 | 状态 |
|---|---|---|
| 1 | 710-A 拆暗链 + 地基 | ✅ 已并入 master（PR #16） |
| 2 | **[710-B](./tasks/TASK-710-B-conceiving-note.md)** 构思笔记 + 清理无消费者字段 | 📋 待授权 |
| 2 | **[710-D](./tasks/TASK-710-D-source-realign.md)** 来源归位 + 手记文案分岔 | 📋 待授权 |
| 3 | 710-C 素材明链（引用可写与跟随） | 计划中 |
| 4 | 710-E 接收动作归企划课 | 计划中 |
| 5 | 710-F 总览分段 | 计划中 |

**B / D 无文件重叠，可并行。**

### 旁路候选（未授权，需开卡）

| 优先级 | 事项 | 规模 |
|--------|------|------|
| **P0** | **阶段一人工走查**——700-B/C/D 三处修复 + 710-A 路径 B 均只验了代码，**没人点着走过**。建议 B/D 合完后一次性点完 | 走查 |
| P0 | 删死依赖 `better-sqlite3` / `sqlite3` | 改 `package.json` |
| P1 | 字数统计对齐（三值统一，中文按字符计） | 单点，用户可感 |
| P1 | 验证并定死 Monaco 加载源 | 小 |
| P1 | eslint 启用 `@typescript-eslint` 推荐集 + `exhaustive-deps` | 中 |
| P1 | 修 `backend` 的 `lint` 脚本（改为「client 不存在才 generate」）——已咬三次 | 一行 |
| P2 | 前端最小测试防线，只覆盖保存 / 草稿恢复链路 | 中 |
| P2 | `sessionStore` 路径改用 `os.tmpdir()` | 一行 |
| P2 | Prisma 双配置收敛为 `prisma.config.ts` 单份 | 小 |
| P2 | **创意组孤儿定性**：`CreativeDiscussion` / `PlanningProposal` / `ProposalsPage` / `ProposalReviewPage` / `ReferencesPage` / `AiSearchPage` / `filters.ts#isProposalSubmittable` —— **不删，先判「废弃 / 入口丢失 / 被取代但功能有缺」** | 侦察 |
| P2 | 创作手记归位到作品详情页（现仅编审右栏） | 中 |
| P3 | README / VERSION.json 与本文件三套叙事收敛为一套 | 文档 |
| P3 | `CURSOR_REFERENCE.md` 仍写 `/creative/chat` + L2 占位旧叙事 | 文档 |
| P3 | 20 个 6 月僵尸分支 + 2 个跨月 stash 仍未清理 | 仓库治理 |
| — | legacy 数据层后续清理（不删表，逐步降级） | 大 |
| — | `release-to-studio` 门槛改造 | 大 |

### 已知已有但未启用的资产

`scripts/baseline-e2e-v01.mjs`（18 KB）+ `docs/BASELINE_E2E_V01.md` + `scripts/test-api.js`。
若仍可运行，应替代人工点击式 smoke —— 可重复、有输出、可归档（参考 `reports/continue-writing-smoke-BEFORE-FIX-994f08a.log`）。**开新测试卡前先确认这套东西的存废。**

---

## 暂不做

- P1-c 及入口文案大收口
- `release-to-studio` 门槛改造（未授权）
- 正文编辑器大改
- 创作室改 `summary` / 章节结构 SSOT
- legacy 表删除 / 全局写入封禁
- 长篇立宪文档修订

---

## 设计依据

- `docs/design/616-content-asset-constitution-v0.2.1.md`
- `docs/design/616-B-work-setting-minimal-model-draft.md`
- `docs/design/0608-616-coordination-draft.md`
- `docs/tasks/archive/TASK-616-D-consultation.md`（616-D 会诊 · 已结案）
- `docs/design/design-P1-entry-architecture.md`（P1 已收束）
