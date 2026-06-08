# 0608 阶段封版记录

> **日期**：2026-06-08
> **基线**：`v2-dev` @ `ab7e346`
> **类型**：阶段封版（非功能交付）
> **审批**：司令部（用户）

---

## 1. 当前基线

| 项 | 值 |
|----|-----|
| 分支 | `v2-dev` |
| HEAD | `ab7e346` |
| origin/v2-dev | 已同步（无 ahead/behind） |
| HEAD build | ✅ 已恢复通过（staged-only 验证） |
| WT 污染 | 存在（schema/ChapterPlanningEditor/reader 等），与交付物无关 |

---

## 2. 已确认/追认 commit 清单

### P1 企划课（司令部原始确认）

| Hash | 信息 | 文件 |
|------|------|------|
| `f768af6` | 0608 foundation and planning workspace entry | 多文件 |

### P2 创作室（全部确认）

| Hash | 阶段 | 信息 |
|------|------|------|
| `c1ee91a` | P2-A | Studio three-area project workspace |
| `8ba7c16` | P2-A+ | Start-writing action in studio work detail（本轮追认） |
| `b72f130` | P2-B | Preserve writing context on editor back navigation（本轮追认） |
| `d4fc68a` | P2 hygiene | Tighten work detail department context guards（司令部原始确认） |

### P3 编审部（本轮追认）

| Hash | 阶段 | 信息 |
|------|------|------|
| `5022026` | P3-A | Editorial three-area project workspace |
| `cd5f119` | P3 docs | 0608 editorial workspace design to VPS |
| `9b784dd` | P3 api | Editorial api wrappers + statusLabels G1 fix |
| `377d470` | P3-A+ | WorkDetailPage editorial context + G6 confirm-complete |
| `6d9669b` | P3-B | ReviewDetailPage confirm-review wired to markReviewed |

### P4 文集库（本轮追认 + 修正）

| Hash | 阶段 | 信息 |
|------|------|------|
| `b184e6f` | P4-A | Library three-area project workspace |
| `451f97e` | P4-A+ | WorkDetailPage library context + archive action |
| `7176666` | ~~P4-B~~ | **🔴 已 revert（d794bde）** — 见 §3 |
| `ab7e346` | P4-B ✅ | Add library phase badges on LibraryDetailPage（2 行最小补丁） |
| `6f4d9d0` | P4 docs | P4 task cards + progress table |
| `6253623` | P4 docs | Mark P4 complete in README |

### 7176666 事件记录

**Commit**: `7176666` — `fix(frontend): use library phase badges on LibraryDetailPage`

**问题**：
1. Commit message 与 diff 不符 — 声称仅改 phase 标签，实际引入 Reader 组件
2. 引入未版本化组件 `WorkReaderPanel.tsx`（仅 WT untracked，从未 commit）
3. 内联章节阅读 UI 替换为 `<WorkReaderPanel />`，变量重命名 `selectedChapterId→activeChapterId`
4. 导致 HEAD 干净树不可构建（`TS2307: Cannot find module`）

**处理**：
1. 全管线审计发现 WT 污染
2. 提交审计逐条定位到 7176666
3. 司令部决议：不追认，执行 revert
4. `d794bde` — revert 7176666
5. `ab7e346` — 重做 P4-B 最小补丁（仅 2 行 phase="library"，零夹带）

**原因分析**：Cursor 在执行 P4-B 时，WT 中已有未提交的 Reader 组件探索成果，selective stage 时未严格区分任务范围，将 WT 中的 Reader 实验代码一并 stage 进入 commit。

**防线**：见 §5 流程复盘。

---

## 3. 当前架构结论

### 五部门三工作区已定型

```
创意组(4Tab) → 企划课(P1) → 创作室(P2) → 编审部(P3) → 文集库(P4)
  提案          planning→       writing→      reviewing→     archived
               planned         written        reviewed
```

### 后端状态流转（自 P1 后未改）

| 组件 | 状态 |
|------|------|
| `PROJECT_STATUSES`（7 段状态流） | ✅ 自 f768af6 定型后未改 |
| 6 个跨桶语义端点 | ✅ 自 P1 后未增未改 |
| `stage-guard.ts` 跨桶拦截 | ✅ 自 P1 后未改 |
| `IN_BUCKET_TRANSITIONS` 桶内白名单 | ✅ 自 P1 后未改 |

### 前端路由骨架（自 P2 后未改）

| 部门 | 路由 | `?from=` 上下文 | 状态 |
|------|------|----------------|------|
| 企划课 | `/planning/*` | `from=planning` | ✅ P1 定型 |
| 创作室 | `/writing/projects` | `from=writing` | ✅ P2-A 定型 |
| 编审部 | `/editorial` | `from=editorial` | ✅ P3-A 定型 |
| 文集库 | `/library` | `from=library` | ✅ P4-A 定型 |
| WorkDetailPage 中枢 | `/work/:id` | 四上下文 + badgePhase | ✅ P2-hygiene 收口 |

### 0608 原则落地情况

| # | 原则 | 状态 |
|---|------|------|
| 1 | 五部门三工作区 | ✅ 前端骨架 + 路由 + 上下文全部就位 |
| 2 | 确认完成 ≠ 放行下一部门 | ⚠️ 语义动作已分离，放行协议未实现 |
| 3 | 不允许跨部门退回 | ✅ stage-guard 硬拦截 |
| 4 | 允许部门内退回 | ✅ IN_BUCKET_TRANSITIONS 白名单 |
| 5 | 文件暂存 ≠ 状态机 | ✅ deletedAt 元标记，restore 不改 status |
| 6 | 部门上下文决定标签 | ✅ getProjectStatusLabel 四分支完整 |
| 7 | L1 是提交动作串联 | ✅ 5 部门 L1 路由 + ?from= 上下文 |
| 8 | 单层全局标签废弃 | ✅ 新 UI 走 phase 标签 |
| 9 | 拒绝 1.0 思维污染 | ⚠️ completed legacy 路径残留，无 UI 影响 |
| 10 | 每枪 commit 小而可审 | ✅ 除 7176666 外全部 1 文件 / ~15 行量级 |

---

## 4. 当前遗留项分级

### P0 — 阻断项：无

HEAD `ab7e346` 构建通过，五部门主流程完整。

### P1 — 必须修复：无

### P2 — 低优 hygiene：无

### 后续设计项（📋 级）

| 项 | 阶段 | 说明 |
|----|------|------|
| 创意组合规审计 | P4 低优 | 0608-creative-workspace.md §3 合规检查表 |
| 放行协议 | Commit 1+ | release-to-* 端点 + 前端放行动作 |
| AI 审阅报告 | P3-C/Day 3 | ReviewDetailPage AI 占位已就绪 |
| AI 书评 | Day 3 | LibraryDetailPage 书评占位已就绪 |
| 创意组三工作区视图 | 可选 | 企划建议书 Tab 内三区子视图 |
| WT 污染清理 | 运维 | schema/ChapterPlanningEditor/reader 等 |

---

## 5. 流程复盘

### 事故：未确认 commit 被推远端

**经过**：
1. Cursor 按指令链将 P2-A+ / P2-B / P3 / P4 的 commit 推到了 `origin/v2-dev`
2. Claude 在未经验证的情况下，将 Cursor 自报的 commit 标记为"已完成"
3. 司令部发现已确认记录与 HEAD 不一致
4. 触发事实核验 → 提交审计 → 发现 7176666 夹带

**发现方式**：司令部凭记忆发现已确认 commit 与仓库 HEAD 不匹配。

**审计方式**：对 `c1ee91a..d4fc68a` 范围所有 commit 做逐条审计。

**修正方式**：11/12 commit 追认，1/12（7176666）revert + 重做最小补丁。

### 后续防线

```
Cursor 执行 → Claude 前线核验 → 司令部检查点确认 → 宣告完成
                    ↑                            ↑
           基于设计文档 + 不变量          基于 git log + build
           做静态验证                      做端到端验收
```

**关键改进**：
1. **未 stage / 未 commit 的 VPS working tree 内容只能作为侦察素材。** 不能被标记为已完成，不能作为基线。所有阶段成果必须以 commit hash + build/审计证据为准。
2. Cursor 可执行并 push，但 commit 标记为"已报未确认"
3. Claude 必须做静态核验后才算"前线确认"
4. 司令部检查点是唯一宣告"完成"的角色
5. commit 在司令部确认前，不写入任何"已交付"记录
6. 7176666 教训：selective stage 必须严格区分任务范围，WT 探索性代码不得混入任务 commit

---

## 6. 签署

```
编制：前线指挥部（Claude）
核验：前线指挥部（Claude）
审批：司令部（用户）— [ ]
```
