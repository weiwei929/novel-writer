# TASK-700-F: 创作手记 · 后端记录层（WorkNote）

> **状态**：✅ 已完成 · 创建 2026-07-27 · 审卡改定并执行同日  
> **备份**：`D:\workspace\content\docs\novel-writer\backups\dev.db.pre-700F-20260727-115947.db`  
> **存量**：《美丽的一天》initial×6；脚本第二遍 inserted=0  
> **模式**：中卡 · **含 schema 变更** · 只做记录层，不做呈现 UI  
> **上游**：[TASK-700 §4.2–4.6 / §4.8–4.9](./TASK-700-v2.7.27-pipeline-completion.md)（**§4.7 不作为实现依据**）  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1` @ `c2453e9`  
> **前置**：B/C/D/E 已合入；阶段一人工走查**暂缓**（不阻塞本卡）

---

## 背景

创作手记要回答「改了什么 / 为什么改」。后者靠编审 UI（另卡）；前者必须在改动发生时落库。`Project.metadata` 无历史，**今晚不上记录层 = 永久少一天痕迹**。

本卡只交付：**表 + 静默写入钩子 + 缘起快照 + 存量初始快照**。编审分栏 / `note` 编辑 / 文集展示 **不做**。

---

## 假设（已声明）

1. **`kind String @default("edit")`，非可选**。仅两值：`edit` | `initial`。  
   - `edit`：`recordedAt` 是我们亲眼看到内容变化的时刻（可信）。  
   - `initial`：上线补拍，`recordedAt` 只是开始记录的时间（不可冒充创作时刻）。  
   - **禁止**用 `note` 塞系统文案——`note` 专留给作者写「为什么」。  
   - `origin` 是 `field` 取值，不是 kind；立项记缘起属真实事件，`kind` 仍为 `edit`。  
2. **§4.7 一律不实现**（不拆两表、不做 diff 引擎、不双时间戳）。  
3. **记录字段**（`field`）：`origin` | `synopsis` | `charactersAndRelations` | `timeAndPlace` | `eventsAndPlot` | `narrativeStyle` | `chapterPlanning` | `overview`。  
   - 本卡**写入**：前 7 类（含 chapterPlanning）。  
   - `overview`：表支持，本卡**不提供写 API**（留给呈现卡）。  
4. **去重**：同一 `projectId + field`，若与**最新一条**的 `content` 完全相同 → **跳过不插**（§4.8）。存量脚本同样遵守；另：若该 field 已有 `kind='initial'` 行，存量脚本跳过该 field。  
5. **`chapterPlanning` content 序列化**：对 canonical 数组 `JSON.stringify` 稳定排序后的结果（实现时固定一种 canonical JSON，单测锁住）。  
6. **缘起 `origin` content**：立项时拼 Proposal 可追溯文本（`title`、`synopsis`、`metadata._sourceNote`；有 `_settingSketch` 则附带）。`_sourceNote` 由 `creativeOrigin.ts` 写入，字面即缘起出处。格式写进单测。  
7. **Proposal 侧** `PUT /proposals` 写 `_settingSketch` **不记 WorkNote**（尚未有 Project）；只在 `acceptIntoPlanningCore` 记缘起 + 首轮 synopsis/workSetting。  
8. **前端零改动**（记录完全隐性）。  
9. 使用现有 Jest + `npm run test:backend`；Windows 上 `npm run lint` 若撞 DLL 锁，验证改用 `npx tsc --noEmit`。  
10. **W1 / W2 / W3 必须**在 `$transaction` 内完成「记笔记 + project update」；禁止「建议」。记录与库状态不一致是硬伤。W4 已在既有 tx 内。

---

## 范围

**可改 / 可新增：**

| 路径 | 动作 |
|------|------|
| `backend/prisma/schema.prisma` | 加 `WorkNote` + `Project.workNotes` |
| `backend/prisma/migrations/<timestamp>_add_work_note/` | migration SQL |
| `backend/src/utils/workNote.ts`（或 `services/workNote.ts`） | `recordWorkNoteDiff` / 去重 / 序列化 |
| `backend/src/routes/projects.ts` | PUT / confirm-metadata / chapter-planning 挂钩 |
| `backend/src/routes/proposals.ts` | `acceptIntoPlanningCore` 内缘起 + 首轮字段 |
| `backend/src/services/__tests__/workNote*.test.ts` | 去重、diff、序列化 |
| `backend/scripts/seed-work-notes-initial.ts`（名可微调） | 存量初始快照，**可重跑幂等** |

**执行前必做（不入库代码，但必须执行并在回报贴路径）：**

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item D:\workspace\content\docs\novel-writer\backend\prisma\dev.db `
  "D:\workspace\content\docs\novel-writer\backups\dev.db.pre-700F-$stamp.db"
# 回报写明实际备份绝对路径
```

## 不做什么

- 编审部左右分栏 / 时间线 UI  
- 批注弹窗、`note` 字段的编辑 API  
- 文集库展示、导出  
- 改前端任何页面  
- 删 legacy 三表、动 AI、改 release/submit 语义  
- 实现 §4.7 被砍设计  

---

## 写入点权威清单（再确认 · HEAD `c2453e9`）

### 如何确认完整（方法，不是「grep 一下」）

1. **穷举写库点**：`rg "prisma\.project\.(update|create)|tx\.project\.(update|create)" backend/src`，对每个 hit 打开函数，看 `data` 是否写入 `metadata` / `description` 中与手记相关的键。  
2. **反向交叉**：从 `mergeProjectUpdateWithSynopsis` / `mergeWorkSettingInProjectUpdate` / `applySynopsisMetadataWrite` / `seedWorkSettingFromSketch` / `normalizeChapterPlanning`（写回 metadata 的调用方）列调用图，与步骤 1 对账。  
3. **前端无旁路**：确认前端只经 REST（`projectsApi.update` / `updateChapterPlanning` / `saveWorkSetting` → PUT）；无直连 SQLite。  
4. **侦察后后端差分**：`git log --oneline 11647b6..c2453e9 -- backend/src` → **空**（B/C/D/E 均未改后端）。清单与 700-A 侦察一致，行号以当前文件为准。

### 必须挂钩（会改变手记字段）

| # | 位置 | 写入字段 | 事务内? | 钩子 |
|---|------|----------|---------|------|
| W1 | `routes/projects.ts` `PUT /:id`（约 L1168–1198）经 `mergeProjectUpdateWithSynopsis` + `mergeWorkSettingInProjectUpdate` | `synopsis`（及 description 双轨）、`workSetting.*` 四块；**若 body.metadata 带 `chapterPlanning` 也会被浅合并覆盖** → 必须对 chapterPlanning 做 diff | **必须** `$transaction`（记笔记 + update） | **主收口** |
| W2 | `routes/projects.ts` `PUT /:id/chapter-planning`（约 L1240–1266） | `chapterPlanning` | **必须** `$transaction` | 调同一 `recordWorkNoteDiff` |
| W3 | `routes/projects.ts` `POST /:id/confirm-metadata` 确认分支（约 L450–523） | `synopsis`（经 `applySynopsisMetadataWrite`）；draft 若含 workSetting 键亦可能写入 → diff 全量受控字段 | **必须** `$transaction` | 同收口 |
| W4 | `routes/proposals.ts` `acceptIntoPlanningCore`（约 L60–93） | 首轮 `synopsis`、`workSetting` seed；**同 tx 写 `field='origin'`**（`kind='edit'`） | **是**（已有 tx） | 用 `tx` 调 `recordWorkNote*` |

### 明确不挂钩（已审查，无手记字段或未定稿）

| 位置 | 原因 |
|------|------|
| `extract-metadata` → 只写 `_draft` | 定稿在 confirm-metadata（W3） |
| `confirm-metadata` 拒绝分支 | 删 draft，不改受控字段 |
| `transition` / `release-to-*` / `archive` / `shelve` / status 语义端点 | 只改 status / 交接戳 / shelved 元数据 |
| `chapters.ts` `updateProjectStats` | 只改 `wordCount` |
| `POST /projects`、导入 `project.create` | 无 workSetting/synopsis/chapterPlanning 手记载荷（description 仅为导入说明） |
| `PUT /proposals`（含 `_settingSketch`） | 提案侧，无 Project；立项时 W4 捕获 |

### 收口方案（已定）

**单点收口函数 + 四处调用**，不挂进 `applySynopsisMetadataWrite` 内部（避免双计、且 chapter-planning / accept 不走该 helper）。

```text
recordWorkNoteDiff(db, projectId, before, after) →
  逐 field 比较序列化 content → 与最新条相同则跳过 → 否则 insert
```

- `before`/`after`：从 metadata（+ description 对 synopsis 的读模型）抽出受控字段。  
- W1/W2/W3：**必须**短事务，`db = tx`；W4：复用既有 `tx`。

---

## 操作步骤

### 0. 备份（强制，先于任何 migration）

见「范围」中的 `Copy-Item` 命令；回报贴备份绝对路径。**含《美丽的一天》的真实库。**

### 1. Schema + migration

在 `schema.prisma` 增加（字段照抄 §4.6，外加假设 1 的 `kind`）：

```prisma
model WorkNote {
  id         String   @id @default(uuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  field      String
  content    String
  note       String?
  kind       String   @default("edit")  // 'edit' | 'initial'
  recordedAt DateTime @default(now())

  @@index([projectId, recordedAt])
}
```

`Project` 增加 `workNotes WorkNote[]`。

生成并应用 migration（优先 `npx prisma migrate dev --name add_work_note`；若环境只能 push，须同时留下等价 SQL 文件于 `prisma/migrations/`，回报说明）。

**先停 backend dev**，避免 DLL 锁。

### 2. 实现 `recordWorkNoteDiff` + 单测

- 去重规则单测（相同 content 不插；不同则插）  
- chapterPlanning 序列化稳定单测  
- 初始快照幂等单测（可对 sqlite test 或逻辑纯函数）

### 3. 挂 W1–W4

- 接线后用 API 改 synopsis / 某 workSetting 块 / chapterPlanning 各一次，断言 WorkNote 行数 +1；再提交相同内容，行数不变。  
- 新建提案立项：断言存在 `field=origin` 一条，且 synopsis/workSetting 有对应首轮行（有内容才写）。

### 4. 存量初始快照脚本

- 遍历未软删 Project；对各 field 若有非空当前值且无 `kind=initial` 且最新 content 不同，则插入 `kind='initial'`，`note` 建议写「初始快照 · 此前历史不可追溯」。  
- **重跑不得重复插入**（假设 4）。  
- 脚本路径与运行命令写入回报；默认 dry-run 开关可选，但验收必须对真实 `dev.db` 跑一次（备份后）。

### 5. 门禁

```powershell
cd D:\workspace\content\docs\novel-writer\backend
npx tsc --noEmit
npm test
```

---

## 预期结果

- DB 有 `WorkNote` 表；《美丽的一天》等存量作品各非空字段有且仅有一批 `kind=initial` 快照。  
- 之后经 W1–W4 的每次真实内容变更追加一行；重复保存不灌水。  
- 前端无可见变化。

---

## 验证方法（必须可执行）

```powershell
# 备份存在
Get-ChildItem D:\workspace\content\docs\novel-writer\backups\dev.db.pre-700F-*

# schema
rg -n "model WorkNote" backend/prisma/schema.prisma

# 挂钩点
rg -n "recordWorkNote" backend/src

# 门禁
cd backend
npx tsc --noEmit
npm test

# 行为探针（示意）
# 1) 改 synopsis → SELECT count(*) WHERE field='synopsis' 增加
# 2) 再 PUT 相同 synopsis → count 不变
# 3) 存量脚本跑两遍 → kind=initial 行数不变
```

---

## 回滚方案（schema 级 · 必须真能回）

**顺序不可反。**

1. **停 backend dev**（防 DLL / 防写入）。  
2. **代码回滚**：

```powershell
cd D:\workspace\content\docs\novel-writer
git revert <本卡 commit>   # 或 checkout 本卡改动的路径
```

3. **数据库回滚（二选一，优先 A）**  

**A. 整库恢复（推荐，含《美丽的一天》状态一致）**

```powershell
# 停服务后
Copy-Item -Force "D:\workspace\content\docs\novel-writer\backups\dev.db.pre-700F-<stamp>" `
  D:\workspace\content\docs\novel-writer\backend\prisma\dev.db
cd backend
npx prisma generate
```

**B. 仅拆表（代码已回滚、只想丢手记数据时）**

```sql
DROP TABLE IF EXISTS WorkNote;
-- 并从 _prisma_migrations 删除 add_work_note 对应行（若用了 migrate）
```

然后 `npx prisma generate`。

4. **存量脚本**：无反向「删除 initial」要求——整库恢复已覆盖；若只拆表，initial 行随表消失。  
5. **幂等**：回滚后再执行本卡，备份新 stamp 后可重做，不依赖「手动清半成品行」。

> 禁止「只 git checkout 代码、不处理 DB」——会导致 client/schema 与 SQLite 不一致。

---

## 回报格式

- 做了什么  
- 改了哪些文件（完整路径）+ **备份绝对路径**  
- 如何验证（命令输出摘要；含去重与存量脚本跑两遍）  
- 还剩什么（呈现卡 / note API）  
- 风险或阻塞  

---

## 审卡提示（给司令官）

本卡与 B–E 不同：**回滚必须含 DB**。请重点核对：备份命令、migrate 回退、initial 幂等、去重规则是否写死到可执行步骤。
