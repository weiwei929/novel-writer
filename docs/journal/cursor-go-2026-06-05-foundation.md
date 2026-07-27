# 2026-06-05 Cursor 执行卡：Day 2 收口（**以你意见为准**）

> 性质：执行，**按你 5 段回答的优先级推进**（git → DB → 后端 → 死代码 → 文档）
>
> 上一份调研：`docs/design/cursor-discussion-2026-06-05-foundation.md`
> 真源定位：**VPS 是 git 工作区真源**（11 文件未 commit 在 VPS，D 盘 staging 只有预备删除）
> API 前缀：已确认 `/api/v2`（D 盘 `api.ts:4` 与 VPS `index.ts` 一致，**端点 100% 命中** ✓）

---

## 已对齐

- **真源** = VPS（你改、commit、push 在那里）
- **D 盘** = Claude 在那里改 doc（不在 VPS 端触碰）
- **优先级** = 你 5 段回答的 P0/P1/P2 排序，**完全采纳**

## 执行顺序（git → DB → 后端 → 死代码 → 文档）

### Step 1: commit 6 卡 11 文件
- `git status` 应看到 5 新 + 6 改 = 11 文件
- commit message: `feat(frontend): Day 2 编审部 + 文集库 L1/L2 骨架（TASK-240–245）+ M1-A 收口`
- **合一笔**（用户 6-05 偏好阶段性批量提交；M1-A 收口 + Day 2 6 卡是同一里程碑）
- **不要 push**（等用户在 Windows D 盘 pull + 验证 staging 后再决定 push 协议）

### Step 2: 补跑 Day1 migration
- `cd /root/novel-writer && pnpm prisma migrate deploy`
- 验证 `submittedToPlanningAt` 等新列存在：
  ```sql
  .schema submittedToPlanningAt  # 确认列存在
  ```
- 如果缺 Day1 migration 文件，**先看 `prisma/migrations/` 目录有什么**，告诉我哪个 migrate 文件应跑

### Step 3: 拉起生产后端
- 现成 `ecosystem.config.js` 在仓库根 → `pm2 start ecosystem.config.js` 或 `pm2 restart`
- 验证 `/api/v2/health` 返回 200（**注意 v2 不是 v1**）
- 同时检查 `/api/v1/*` 实际是否还有路由（如你之前 grep 发现 `index.ts` 只注册 `/api/v2/*`，要确认前端 6 卡代码用的也是 `/api/v2` —— 我已 grep D 盘 `api.ts:4 = '/api/v2'` ✓）

### Step 4: 死代码清理（**按你 grep 的顺序**）

| 序 | 文件:行 | 内容 | 处置 |
|---|---------|------|------|
| 1 | `api.ts:51` | `'completed',` 字面量 | 从 `PROJECT_STATUS` primary 数组移除（**保留** legacy read 映射）|
| 2 | `api.ts:53` | `'shelved',` 字面量 | 从 primary 数组移除（**保留** legacy read 映射；Day 2 方案 C 已取消 shelved）|
| 3 | `ProjectStatusBadge.tsx:11` | `completed: 'bg-green-50...'` | cls 移除 |
| 4 | `ProjectStatusBadge.tsx:13` | `shelved: 'bg-red-50...'` | cls 移除 |
| 5 | `HomePage.tsx:55` | `to: '/review'` | 链接移除（1.0 章节审阅已废）|
| 6 | `App.tsx:354` | `path: '/review'` | 路由条目移除 |
| 7 | `ShelfPage.tsx:50` | `const shelved = getShelvedMeta` | shelved 元数据移除（注意 ShelfPage 本身 M3 改 `/graveyard`，**先 M1-B 决定**——这一步**先跳过**，M3 一起改）|
| 8 | `WorkDetailPage.tsx:42` | `completed: '已完成'` | label 移除（legacy read 不入 label）|

**这 8 处**改完后，再 grep 一次确认 0 匹配：`grep -rn "shelved\|completed\|/review" frontend/src/`

### Step 5: D 盘真源对齐
- **不需要你做**——这是用户在 Windows 端 `git pull` 的事
- 你在 VPS commit 后，告诉我 commit hash，我让用户在 D 盘 pull 验证

### Step 6: 文档同步
- **不需要你做**——5 份 doc 在 D 盘，Claude 在那里改
- 改什么（已 grep 5 份 doc 的 ## 标题）：

| Doc | 段 | 改法 |
|-----|----|------|
| `overall-architecture.md` | `### Day 2 / Day 3 待设计` 段 | 改为 `### Day 2 已交付`，列 6 卡（240-245） |
| `overall-architecture.md` | `### 已交付` 段 | 加 Day 2 子段 |
| `code-conflict-analysis.md` | 缺 Day 2 落点段 | 加一段 `## Day 2 落点（M1-A 端点 + 6 卡 L1/L2）` |
| `code-conflict-analysis.md` | `## 10 步落地顺序` | 加 M1-A→Day 2 实际进展（已完成 1-5）|
| `day1-handoff-brief.md` | `## 待 Day 2 / Day 3` 段 | 改为 `## Day 2 已交付 / Day 3 待设计`，列 6 卡 |

**`editorial-dept-v2.md` 和 `editorial-library-v2.md` 不用改**——它们在 D 盘已有 Day 2 状态描述。

---

## 红线

- ❌ 不要 push（等用户 D 盘 pull 后再决定）
- ❌ 不要触碰 D 盘 docs（VPS 端没 doc）
- ❌ 不要改锚点 memory（Claude 在 D 盘改）
- ❌ 不要开新业务 TASK 卡（M2/M3 都不开）
- ❌ 不要触碰 `ShelfPage.tsx` shelved 元数据（M3 一起改）
- ❌ 不要触碰 6 卡 out-of-scope 文件

## 鼓励

- ✅ 每完成 1 步回报 1 次（关键 diff + grep 输出 + 下一步建议）
- ✅ 如发现 design doc 与实际不符，**主动指出来**（不要闷头改）
- ✅ commit message 用上面的标准字符串
- ✅ Step 1 完成后，告诉我 commit hash（不 push，只 hash）

---

## 与你的拍板 1:1 对应

| 你建议 | 我的执行卡 |
|--------|----------|
| P0 commit 6 卡 → push | Step 1（commit only，push 协议待 D 盘对齐后）|
| P0 补跑 Day1 migration | Step 2 |
| P0 拉起生产后端 | Step 3 |
| P1 死代码清理（你给的顺序）| Step 4（**ShelfPage shelved 元数据先跳过**）|
| P1 文档补建 | Step 6（Claude 在 D 盘改）|
| P2 对齐 D 盘真源 | Step 5（用户 Windows 端 `git pull`，不归你管）|

**执行周期预估**：Step 1-4 约 30-60 分钟（git status + commit + migrate + 起后端 + 8 处 grep 改）。Step 5-6 由用户和我并行处理。

---

## 我会同时做（D 盘侧，与你并行）

1. **Step 6**：改 3 份 doc 同步 Day 2 实际状态
2. **P1-C**：重写 `feedback_mount_git_state_inconsistency.md`（**已完成**——VPS 是真源）
3. **执行后回报**：你每完成 1 步，我 5 项核对（只审 in-scope 守住 / out-of-scope 越界 / C 修订应用 / 18 不变量 / 端点字段存在性——不死代码细节）
