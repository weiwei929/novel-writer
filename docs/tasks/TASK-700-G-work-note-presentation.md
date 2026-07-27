# TASK-700-G: 创作手记 · 编审呈现层

> **状态**：现役 · 实现完成待 commit · 最后核对 2026-07-27  



> **模式**：中卡 · 前后端 · **无 schema 变更**  
> **上游**：[TASK-700 §4.5 / §4.6 / §4.9](./TASK-700-v2.7.27-pipeline-completion.md) · 记录层 [TASK-700-F](./TASK-700-F-work-note-recording-layer.md)（`c52d00c`）  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1` @ `d434392`（含备份脚本 chore；与本卡无关，**勿动** `scripts/backup-novel-db.ps1`）  
> **前置**：700-F 已上线并在积累数据

---

## 背景

记录层只解决「改了什么」。呈现层让作者在编审阶段补「为什么」，并把 `kind=initial` 的时间谎言标出来。

现役 `ReviewDetailPage` 已是三栏：左章节 / 中正文 / 右 **AI 审阅报告（冻结占位）**。本卡把右栏换成创作手记时间线，**不重做整页布局**。

---

## 假设（已声明）

1. **布局**：沿用 `ThreeColumnLayout`。左栏 + 中栏 = 「现有审阅」保持不动；**右栏**替换 AI 报告占位为手记时间线（§4.5 语义上的「右栏手记」）。不把页面硬拆成两栏容器。司令官已批准三栏方案（2026-07-27）。  
   1b. **右栏宽度硬定**：`rightWidth` **≥ 360px**（默认用 `360px`）。右栏是本页主角之一，不是窄侧栏；须能同时容纳字段标签 + 内容摘要 + 时间 + kind 标注 + 点击写 note。若加宽后中栏正文挤得难看 → **回报说明，禁止默默塞回去**。  

2. **「生成报告」按钮**：保留在 header，继续走 AI 冻结逻辑；**本卡不改其行为/文案**。右栏不再展示 `REVIEW_DIMENSIONS` 占位块。  
3. **`kind='initial'`**：时间线条目上必须有**显著、常驻**标注「初始快照 · 此前历史不可追溯」（徽章/横幅均可，但不可仅靠 tooltip）。**禁止**把该文案写入 `note`。`recordedAt` 对 initial 可显示，但须与标注同时出现，避免被读成「创作日」。  
4. **时间线排序**：`recordedAt` 升序或降序二选一，默认**降序（新在上）**；回报写明。`field=overview` **不进**时间线列表（见下）。  
5. **总述 `overview`**：每作品至多一条。`content` 即作者正文；审阅页单独区块编辑（右栏顶部或时间线上方）。创建时 `kind='edit'`。更新 = 改同一行的 `content`（不是追加）。本卡**不**为 overview 走静默 `recordWorkNoteDiff` 钩子——用专用 upsert API。  
6. **note 弹窗**：仅对时间线条目（非 overview）打开；读写字段仅为 `note`（可空）。不在弹窗里改 `content`。  
7. **可见范围**：仅编审详情 `/review/:projectId`（队列内 `written`|`reviewing`）。不改列表页。  
8. **无 schema 变更**。若实现中发现必须加字段 → **停手提异议**，禁止自行 migration。  
9. **验证数据**：验收前必须对《美丽的一天》（或等价测试作）**真实改设定若干次**，产出 `kind=edit` 行；仅看 6 条 initial **不算**通过。  
10. 前端测试仍无强制要求；后端新路由至少有可执行探针 + 既有 `npm test` 不破。Windows lint 撞 DLL 时用 `npx tsc --noEmit`。

---

## 范围

**可改 / 可新增：**

| 路径 | 动作 |
|------|------|
| `backend/src/routes/projects.ts`（或抽 `routes/workNotes.ts` 挂同一 prefix） | `GET` 列表、`PATCH` note、`PUT` overview upsert |
| `backend/src/services/__tests__/` | 可选：overview upsert / note patch 单测；有则佳 |
| `frontend/src/services/api.ts` | 客户端方法 |
| `frontend/src/pages/ReviewDetailPage.tsx` | 右栏时间线 + overview + 弹窗接线 |
| `frontend/src/components/...`（新建 1～2 个小组件） | 如 `WorkNoteTimeline` / `WorkNoteNoteModal`；**禁止**无关抽象 |

**只读参考：**

- `backend/src/utils/workNote.ts`（field 枚举、kind 语义）  
- `frontend/src/components/creative/ThreeColumnLayout.tsx`

## 不做什么

- 文集库入口 / 展示（§4.9 → 下一张卡）  
- 导出、diff 渲染、双时间戳（§4.7）  
- 改 700-F 记录钩子 / 去重 / seed 脚本  
- 动 AI「生成报告」逻辑或解冻  
- 改 `scripts/backup-novel-db.ps1`  
- 扩表、加列、改 Prisma schema  

---

## API 约定（执行时照此实现；路径名可微调但语义锁定）

均在 `/api/v2/projects` 下，需登录。

| 方法 | 路径 | 行为 |
|------|------|------|
| `GET` | `/:id/work-notes` | 返回该作全部 WorkNote，按 `recordedAt` 排序（与假设 4 一致）。含 `id,field,content,note,kind,recordedAt` |
| `PATCH` | `/:id/work-notes/:noteId` | body `{ note: string \| null }`；校验 note 属于该 project；**只更新 note** |
| `PUT` | `/:id/work-notes/overview` | body `{ content: string }`；upsert `field='overview'` 唯一行（无则 create `kind=edit`，有则 update `content`） |

错误：404 project / note；400 校验失败。

---

## 操作步骤

1. **后端 API**  
   - 实现上表三端点。  
   - overview upsert：`findFirst({ projectId, field: 'overview' })` → update 或 create。  
   - 列表可选择是否默认排除 overview（前端也可滤）；若 API 返回全量，前端时间线必须排除 `field==='overview'`。

2. **前端 API 封装**  
   - `api.ts` 增加 `listWorkNotes` / `updateWorkNoteNote` / `upsertWorkNoteOverview`。

3. **ReviewDetail 右栏**  
   - 加载手记；顶部 overview 编辑区（保存调 upsert）。  
   - 下方时间线：展示 field 中文标签、content 摘要（可截断）、`recordedAt`、`kind` 标注。  
   - **`kind==='initial'` → 显著标注「初始快照 · 此前历史不可追溯」**（假设 3）。  
   - 点击条目 → 弹窗编辑 `note`，保存调 PATCH，成功刷新。

4. **验收用数据准备（必做）**  
   - 对《美丽的一天》经企划/详情真实改 1～2 个设定块并保存，确认 DB 出现 `kind=edit` 新行后再截图/描述时间线。  
   - 探针示例：`PUT /projects/:id` 改 `metadata.workSetting.charactersAndRelations` 后 `GET .../work-notes`。

5. **门禁**

```powershell
cd D:\workspace\content\docs\novel-writer\backend
npx tsc --noEmit
npm test

cd ..\frontend
npm run lint
npm run build
```

---

## 预期结果

- 编审详情右栏为手记：有 initial 警示、有 edit 条目、可写 note、可写 overview。  
- 左/中审阅与「标记已审」行为不变；「生成报告」仍冻结。  
- schema 无变更。

---

## 验证方法（必须可执行）

```powershell
# 1) 无 schema 漂移
git diff -- backend/prisma/schema.prisma
# 预期：空（本卡）

# 2) API 探针（需登录 session；替换 $ID）
# GET  /api/v2/projects/$ID/work-notes  → 含 kind=initial 与（准备后）kind=edit
# PATCH /api/v2/projects/$ID/work-notes/$NOTE_ID  body {"note":"因为节奏"} → 200，note 已更新
# PUT  /api/v2/projects/$ID/work-notes/overview body {"content":"总述……"} → 200；再 PUT 同路径改 content，行数仍为 1

# 3) UI
# 打开 /review/$ID ：右栏可见「初始快照 · 此前历史不可追溯」；有 edit 条目；点开可写 note；overview 可保存

# 4) 门禁见上
```

**验收硬条件**：时间线中同时存在 `initial`（带标注）与至少一条 `edit`；否则重做步骤 4。

---

## 回滚方案

无 migration。代码级回滚即可：

```powershell
cd D:\workspace\content\docs\novel-writer
git revert <本卡 commit>
# 或
git checkout HEAD~1 -- backend/src/routes/projects.ts frontend/src/pages/ReviewDetailPage.tsx frontend/src/services/api.ts
# 以及本卡新增的组件文件
```

- 已写入的 `note` / `overview` **行会留在 DB**（数据不丢）；回滚的是 UI/API。  
- 若需清试验 note：手动 SQL/`prisma` 清即可，非本卡强制。  
- **禁止**借回滚之机改 700-F 表结构。

---

## 回报格式

- 做了什么  
- 改了哪些文件（完整路径）  
- 如何验证（含：如何产出 edit 行；initial 标注截图或 DOM/文案确认；overview 两次 PUT 仍一行）  
- 还剩什么（文集 §4.9）  
- 风险或阻塞（若想扩表，写在这里停手）

---

## 已知缺口（本卡不处理 → §4.9 必做）

点「标记已审」后作品离开 `written|reviewing`，现页队列关上手记入口。审阅阶段才是写手记的时候；归档进文集后若读不到、改不了，§4.9「自己保留」就是空话。

**下一张（文集库 §4.9）必做**：归档后手记仍可读、可续写。本卡**不扩大** `EDITORIAL_QUEUE_STATUSES`。

## 异议预留（执行中若撞上再开）

- 右栏 360px 加宽后中栏难看：停手回报，勿默默缩回。  
- 若发现必须加 schema 字段：停手提异议。
