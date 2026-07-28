# TASK-710-A: 拆暗链（扩大版）+ 地基两行

> **状态**：⏳ 待授权 · 创建 2026-07-28
> **模式**：小卡 · **后端为主** · **无 schema 变更**
> **架构师**：Claude（参谋长）
> **操作员**：Cursor IDE
> **上游**：[TASK-710 创意组种子链补齐](./TASK-710-creative-seed-chain.md) · 侦察 [TASK-710-S](./TASK-710-S-cursor-scout.md)（✅ 已回报）
> **基线**：`feature/workdetail-p1` @ `a0f9947`（与 origin 同步后再开工）
> **前置**：无。本卡为 710 战役第一枪
>
> ---
>
> ## ✅ 已完成 · 2026-07-28
>
> | commit | 内容 |
> |---|---|
> | `a336f6d` | 拆暗链 · `proposals.ts` −45 / +2 |
> | `9110066` | `host` → `127.0.0.1` |
> | `24bfbef` | **卡外必要补丁** · `import 'dotenv/config'`（见「执行修正」） |
>
> **验收（参谋长逐项复核代码）**：物化整段与 `splitParagraphs` / `paragraphTitle` 零残留；`refs` 一并清除；`_sourceRef` 字段与 `processingType` 列未动；approve 其余七项动作原样在位。路径 A 6→0 章、路径 B 2→0 章。探针残留 0；《美丽的一天》WorkNote 8 未变。
>
> ### 执行修正一：卡漏了 dotenv（参谋长的错）
>
> 卡里假定「改 `host` + 写 `.env`」两行即可。**实际不成立**——`index.ts` 从未加载 dotenv，`auth.ts` 在 import 时就固化了兜底值，写进 `.env` 的 `APP_PASSWORD` 是死的（启动日志持续报 `APP_PASSWORD not set`）。Cursor 补 `import 'dotenv/config'` 属**必要越界**，正确。
>
> **副作用备查**：`backend/.env` 现在会被完整载入 `process.env`，其中包含 `GEMINI_API_KEY`——此前它不进环境变量。后端 AI 路由在全局鉴权之后，UI 层仍冻结。仅作记录。
>
> ### 执行修正二：密码维持 `novel2024`（司令官 2026-07-28 拍板）
>
> 执行中一度改为随机密码。**已驳回：过度保护。**开发阶段沿用 `novel2024`，正式上线前再议。
>
> **收尾动作**：从 `backend/.env` 中**删除 `APP_PASSWORD` 键**，让 `auth.ts` 的兜底重新生效。`24bfbef` 与 `9110066` 均**保留**（dotenv 加载对其他键仍必要；`host` 收紧不影响本机使用）。
>
> 参谋长曾建议追加「缺 `APP_PASSWORD` 则拒绝启动」小卡，**同步撤回**。见 [ROADMAP §八 第 9 条](../ROADMAP.md)。
>
> ### 卡本身的错
>
> 门禁段写「预期 4 suites / 16 tests」，实际 **5 suites / 22 tests**——数字抄自 07-25 的 `CURRENT_BASELINE.md`，早已过时。Cursor 未被绊住，但这是卡在制造假警报。
>
> ### 未了
>
> 路径 B 走的是与 UI 同序的 API 调用，**未做浏览器肉眼点击**。并入待办的「阶段一人工走查」，与 710-B / D 合并后一次性点完。

---

## 背景

`acceptIntoPlanningCore`（立项唯一 Project 写入点）中有一段 2026-06-02 引入的自动化（`3d282fe`，author `root`）：**立项时把外来参考的全文按段落切开，批量建成章节正文。**界面上没有任何地方提示会发生这件事。

**侦察实测（2026-07-28）确认有两条触发路径**，参谋长原判断只看到第一条：

| 路径 | 条件 | 实测 |
|---|---|---|
| A | `references[]` 含 `file_ref` + `processingType === 'complete'` | 凭空 **6 章** |
| **B ⚠️** | 仅 `metadata._sourceRef = {type:'file_ref', id}`，**`processingType` 可为 `none`** | 凭空 **2 章** |

**路径 B 是要害**——`createOriginFromExternalRef` 写的正是 `_sourceRef`，所以：

> **「外来参考 → 提炼缘起 → 接收入企划课」这条正常路径本身就会造章节。**

同一窗口顺手收掉两行地基（`host` + `APP_PASSWORD`）。理由见 §六。

---

## 假设（已声明）

1. **存量安全，侦察已实测，本卡不再复验**：`FileReference` 总量 **0**、`processingType === 'complete'` **0** 条、`Proposal.references` 非空 **0** 条 → 删除不改变任何现有作品的既有章节。
2. **`splitParagraphs` / `paragraphTitle` 仅此一处引用**（侦察用全仓符号搜索复核，无第二引用；该环境无 LSP Find References）。**Cursor 有 IDE，请用引用分析再确认一次再删。**
3. **不删 `_sourceRef` 字段本身**。它在详情页作为「来源说明」展示（`ProposalDetailPage:213–221`），仍是现役数据。本卡只切断它触发物化的那条路，不动它的展示语义。
4. **`FileReference.processingType` 列保留**。二值收敛是 710-C 的事，本卡不碰。
5. **本卡不补任何东西**。删掉暗链后，「素材带不进作品」这个缺口**依然存在**——那是 710-C 的活。本卡只止血，不治病。
6. 地基两行与拆暗链**分两个 commit**，可独立 revert。
7. Windows lint 撞 DLL 锁时用 `npx tsc --noEmit`，不要跑 `npm run lint`（它会触发 `prisma generate`）。

---

## 范围

### 可改

| 路径 | 动作 |
|---|---|
| `backend/src/routes/proposals.ts` | 删除章节物化整段（含两条触发路径）+ 两个辅助函数 |
| `backend/src/index.ts` | `host: '0.0.0.0'` → `'127.0.0.1'` |
| `backend/.env` | 新增 `APP_PASSWORD=<司令官自定>`（**未被 git 追踪，已在 `.gitignore:16`**） |

### 只读参考

- `backend/src/routes/auth.ts`（确认兜底逻辑，**本卡不改代码**）
- `frontend/src/services/creativeOrigin.ts`（确认 `_sourceRef` 写入方）

## 不做什么

- **不改 schema**、不删列、不写 migration
- **不删 `_sourceRef`**、不删 `processingType` 列
- **不动 `approve` 的其余七项动作**（Project 创建 / 种子继承 / 手记首条 / legacy 三表迁移 / Proposal 回写 / metadata 固定键 / synopsis 写入）
- **不改 `auth.ts` 的兜底代码**（去掉硬编码兜底是独立议题，本卡只设真密码）
- 不补引用链、不动前端、不碰 `ReferencePicker`
- 不清理 `innovation` / `coreSetting` / `_tags`（710-B）
- 不改空 `_evaluation` 复制行为（710-B 第 5 项）

---

## 操作步骤

### 步骤 1 · 删除暗链（commit 1）

**文件**：`backend/src/routes/proposals.ts`

**1a. 删除章节物化整段。**当前代码（`:124–152` 附近）：

```ts
  const sourceRef = refs.find(
    (r: { type?: string; processingType?: string }) =>
      r.type === 'file_ref' && r.processingType === 'complete'
  ) as { id?: string } | undefined

  const metaSource = metadata._sourceRef as { type?: string; id?: string } | undefined
  const fileRefId =
    sourceRef?.id ?? (metaSource?.type === 'file_ref' ? metaSource.id : undefined)

  if (fileRefId) {
    const fileRef = await tx.fileReference.findUnique({ where: { id: fileRefId } })
    if (fileRef?.fileContent) {
      const meta = (fileRef.metadata as { paragraphs?: string[] }) || {}
      const paragraphs =
        meta.paragraphs?.length ? meta.paragraphs : splitParagraphs(fileRef.fileContent)

      if (paragraphs.length > 0) {
        await tx.chapter.createMany({ /* ... */ })
      }
    }
  }
```

**整段删除**——包括 `sourceRef` / `metaSource` / `fileRefId` 三个局部变量。它们**仅**服务于这段物化逻辑；删完请确认 `refs` 变量是否还有其他消费者，若无则一并清理。

**1b. 删除两个辅助函数**（`:42–54`）：`splitParagraphs`、`paragraphTitle`。**删前用 IDE 引用分析确认零引用**（假设 2）。

**1c.** 若 `fileReference` 的 import / 类型引用因此变为未使用，一并清理。

> **保留边界提醒**：`metadata._sourceRef` 本身**不要删**。`acceptIntoPlanningCore` 上方仍有其它读取 `metadata` 的逻辑（`_settingSketch`、`_evaluation`），且前端详情页在展示 `_sourceRef.title`。

### 步骤 2 · 地基两行（commit 2）

**2a.** `backend/src/index.ts:68`

```ts
await server.listen({ port: 5000, host: '0.0.0.0' })   // 改前
await server.listen({ port: 5000, host: '127.0.0.1' }) // 改后
```

**2b.** `backend/.env` 补一行（该文件未被 git 追踪，`.gitignore:16` 已覆盖）：

```
APP_PASSWORD=<司令官自定，勿用 README 里的 novel2024>
```

**注意**：`.env` 实测**当前没有 `APP_PASSWORD` 键**，所以 `auth.ts:9` 的兜底 `'novel2024'` **现在正在生效**——而该密码印在公开 README 里。同一份 `.env` 里已存有 `GEMINI_API_KEY`。

**2c.** 改完重启后端，确认启动日志不再出现局域网 IP（原为 `192.168.50.159:5000`）。

### 步骤 3 · 门禁

```powershell
cd D:\workspace\content\docs\novel-writer\backend
npx tsc --noEmit
npm test
```

---

## 预期结果

- 「外来参考 → 提炼缘起 → 接收入企划课」后，作品章节数为 **0**
- 带 `processingType: 'complete'` 引用的提案立项后，章节数为 **0**
- `approve` 的其余动作**行为不变**：Project 建出来、设定雏形进 `workSetting`、创作手记首条仍在、Proposal 回写 `approved`
- 启动日志只监听本机；旧密码失效
- `git diff -- backend/prisma/schema.prisma` 为空

---

## 验证方法（必须可执行）

```powershell
# 0) 无 schema 漂移
git diff -- backend/prisma/schema.prisma
# 预期：空

# 1) 类型 + 后端用例
cd backend; npx tsc --noEmit; npm test
# 预期：tsc 静默；4 suites / 16 tests 全绿

# 2) 死函数已清
#    全仓搜索 splitParagraphs / paragraphTitle → 预期 0 命中
```

**3) 路径 B 回归（走正常 UI，最重要的一条）**

```text
外来参考页 → 上传/新建一份带正文的探针参考 TASK710A-probe-ref
  → 提炼创意缘起 → 提交企划课 → 接收入企划课
  → 打开作品详情「章节」Tab
预期：0 章                （修复前：2 章）
```

**4) 路径 A 回归（需绕 UI 造数据，侦察已验证可行）**

```text
PUT /api/v2/proposals/:id  body 含
  references: [{ type:'file_ref', id:'<探针参考 id>', processingType:'complete', title:'...' }]
  → 接收入企划课
预期：0 章                （修复前：6 章）
```

**5) approve 其余动作未被误伤**

```text
探针提案填设定雏形四块任意一块 → 接收
预期：作品设定里能看到该内容；编审详情右栏能看到创作手记首条（含 origin）
```

**6) 地基两行**

```text
启动日志：不出现 192.168.x.x
同 WiFi 另一台设备访问 http://<本机IP>:5000/health → 预期连不上
用 novel2024 登录 → 预期失败；用新密码 → 预期成功
```

---

## 回滚方案

```powershell
cd D:\workspace\content\docs\novel-writer
git revert <commit-2>   # 只回滚地基两行
git revert <commit-1>   # 只回滚拆暗链
```

无 migration、无数据变更、无 schema 漂移。两个 commit 互相独立。

`.env` 的 `APP_PASSWORD` 不在版本控制内，回滚代码不会改动它；如需恢复旧行为，手动删除该键即可（**不建议**）。

---

## 纪律

### §四·五 验收残留

- 探针一律命名 `TASK710A-probe-*`：Project / Proposal / FileReference / Chapter / **WorkNote** 逐类清点
- 测完**硬删并回报计数**
- **禁止污染**《美丽的一天》（Project 1 / WorkNote 8）与《新创意》（Proposal `9f0e1be5-…`）；侦察前后各记一次计数

### 删代码前先定性

本卡删的是**功能废弃**（自动化物化正文，司令官 2026-07-28 明确不要），**不是入口丢失**。与 700-E 删 `ChatPage` 的情形不同——那次删的是"计划中功能的最后痕迹"，这次删的是"没人要的行为"。

> **红线（ROADMAP §四 4.1）**：任何自动化不得在交接时静默物化正文/章节。本卡是这条红线的第一次执行。

---

## 回报格式

- 做了什么（两个 commit 分别是什么）
- 改了哪些文件、删了多少行
- `splitParagraphs` / `paragraphTitle` 的 IDE 引用分析结果（删前）
- 六项验证逐条结果，**路径 A / B 的章节数前后对比**
- 探针清理计数（含 WorkNote）；《美丽的一天》《新创意》前后计数
- 风险或异议

---

## 异议预留

- 若删除 `sourceRef` / `metaSource` 后发现 `refs` 变量还有其他消费者 → **停手回报**，不要自行扩范围
- 若 `npm test` 中有用例依赖章节物化行为 → **停手回报**，这说明该行为曾被当作特性
- 若司令官希望顺带去掉 `auth.ts` 的硬编码兜底（`|| 'novel2024'`）→ 需另行授权，本卡范围内只设真密码
