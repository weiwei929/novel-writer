# TASK-710-D: 来源归位（三块）+ 手记文案分岔

> **状态**：⏳ 待授权 · 创建 2026-07-28
> **模式**：小卡 · **纯前端** · **无 schema 变更** · 无后端改动
> **架构师**：Claude（参谋长）
> **操作员**：Cursor IDE
> **上游**：[TASK-710](./TASK-710-creative-seed-chain.md) 结论 7 / 9 · **取代** [TASK-700-H](./TASK-700-H-creative-conceiving-workbench.md) 的保留部分
> **基线**：710-A 之后（`24bfbef` 或更新）
> **可与 [710-B](./TASK-710-B-conceiving-note.md) 并行**（无文件重叠）

---

## 背景

两件互不相干的小事，都属「看得懂 = 功能」（[ROADMAP §八 第 8 条](../ROADMAP.md)），合成一张卡：

**其一 · 总览来源区看不出能点。**`CreativeWorkspace` 左列「灵感碎片」「外来参考」虽是 `<Link>`，但视觉与正文无异；「AI 搜索」是灰卡。司令官 2026-07-28 拍板：**AI 搜索不是独立来源**，它是获取外来参考的一种方式（`FileReference` 的 `fileContent` 可空、有 `sourceUrl`，已能装搜索结果）。故来源区由**三块**构成，冻结位留给 **AI 讨论**。

**其二 · 创作手记弹窗文案不分 kind。**`WorkNote.kind` 有 `edit`（真实变更时刻）与 `initial`（上线补拍，`recordedAt` 不可信）两种，弹窗却统一问「当时为什么这么改」——对 `initial` 条目是错的，那些不是"改"，是"当初怎么想的"。

---

## 假设（已声明）

1. **来源区三块，不是四块。**灵感碎片 / 外来参考 / AI 讨论（灰）。**不新增第四块**，「AI 搜索」那一格改文案改成「AI 讨论」。
2. **`AiSearchPage.tsx` 与 `/creative/ai-search` 路由本卡不删**，只从总览摘除入口。侦察 J-7 已确认：除 `App.tsx` 路由定义外无其他链入，`Layout` / `CreativePage` / 面包屑均无链，摘除影响面 ≈ 0。删文件留待孤儿定性卡。
3. **AI 讨论灰卡不可点**，与现有 AI 搜索灰卡同构（无 `<Link>` 包裹）。用 `AI_FROZEN_LABEL`（`'AI 集成开发中'`）。
4. **弹窗无需改 props。**`WorkNoteNoteModal` 已接收完整 `entry`，`WorkNote.kind` 存在（`api.ts:190`），schema 默认 `'edit'`，侦察确认**老数据无 `undefined` 风险**。未知 kind 走 `edit` 文案。
5. **不动正文、不动 API、不动 `WorkNote` 记录逻辑。**只改两个字符串。
6. 网格保持 `lg:grid-cols-3`，来源区仍一列堆叠，**不改成 2×2**。

---

## 范围

### 可改

| 路径 | 动作 |
|---|---|
| `frontend/src/components/creative/CreativeWorkspace.tsx` | 两个 Link 加可点视觉；AI 搜索灰卡 → AI 讨论灰卡 |
| `frontend/src/components/editorial/WorkNoteNoteModal.tsx` | 按 `entry.kind` 分岔标题与 placeholder |

### 只读参考

- `frontend/src/config/aiFreeze.ts`
- `frontend/src/services/api.ts`（`WorkNote` 类型）

## 不做什么

- 不新建 `ChatPage`、不建讨论路由、**不解冻 AI**
- 不删 `AiSearchPage.tsx`、不删其路由
- 不改总览中列 / 右列（中列分段是 710-F）
- 不动 `WorkNoteTimeline` 的记录或读取逻辑
- 不动 schema、不动后端

---

## 操作步骤

### 1. 来源区可发现性（`CreativeWorkspace.tsx`）

**1a.** 「灵感碎片」（当前 `:82`）与「外来参考」（当前 `:98`）两张卡：让**整卡**看得出可点。建议——

- 卡片容器加 `hover:border-amber-200 cursor-pointer transition-colors`
- 标题 `<Link>` 改用 `text-amber-700`
- 卡片右上或标题行末补一个「进入 →」小字

具体样式 Cursor 自行拿捏，**要求只有一条：不点进去也能看出这两块能点，且与右侧「AI 讨论」灰卡形成明显对比。**

**1b.** 现有「AI 搜索」灰卡（当前 `:113–116`）**原地改成 AI 讨论**：

```tsx
<div className="bg-white border rounded-xl p-4 opacity-60">
  <span className="text-sm font-semibold text-gray-400">AI 讨论</span>
  <p className="text-xs text-gray-400 mt-2">{AI_FROZEN_LABEL}</p>
</div>
```

从 `../../config/aiFreeze` 导入 `AI_FROZEN_LABEL`。保持不可点（不加 `<Link>`）。

> **为什么是"改"不是"加"**：AI 搜索归位到外来参考（结论 9），不再是独立来源。这一格腾出来给 AI 讨论——它是 2026-06-12 入口丢失后**唯一没有载体的来源**，用冻结位显式占回，不假装功能已交付。

### 2. 手记弹窗文案分岔（`WorkNoteNoteModal.tsx`）

当前硬编码：标题 `:41`「当时为什么这么改」，placeholder `:60`「写下改动的理由（可留空）」。

改为按 `entry.kind` 取值：

| kind | 标题 | placeholder |
|---|---|---|
| `edit` | 当时为什么这么改 | 写下改动的理由（可留空） |
| `initial` | 这块设定当初是怎么想的 | 写下当时的构思（可留空） |
| 其他 / 未知 | 同 `edit` | 同 `edit` |

建议在组件内定义一个小 map，**不要拆成新文件**。

### 3. 门禁

```powershell
cd D:\workspace\content\docs\novel-writer\frontend
npm run lint
npm run build
```

（本卡未改 backend，不必跑 `test:backend`。）

---

## 预期结果

- `/creative/workspace` 来源区**三块**：灵感碎片（可点）/ 外来参考（可点）/ AI 讨论（灰、不可点）
- 不点进去就能看出前两块能点
- 编审详情点 `initial` 条目 → 弹窗标题「这块设定当初是怎么想的」
- 点 `edit` 条目 → 弹窗标题「当时为什么这么改」
- `/creative/ai-search` 直接输入地址仍可访问（本卡不删路由）

---

## 验证方法（必须可执行）

```powershell
# 0) 无 schema 漂移 / 无后端改动
git diff -- backend/          # 预期：空
```

**1) 来源区**

```text
打开 /creative/workspace
预期：来源区三块；灵感碎片、外来参考肉眼可辨为可点；AI 讨论灰且点不动
      来源区不再出现「AI 搜索」
```

**2) 手记文案分岔 —— 验证数据现成，不必造探针**

侦察实测《美丽的一天》有 **6 条 `initial` + 2 条 `edit`**：

```text
编审详情 → 右栏创作手记
  点一条 initial 条目 → 标题应为「这块设定当初是怎么想的」
  点一条 edit   条目 → 标题应为「当时为什么这么改」
```

> **注意**：立项时新建的手记是 `kind = 'edit'`（真实事件），不是 `initial`。别拿它当 `initial` 样本。

**3) 不误伤**

```text
《美丽的一天》WorkNote 条数：前 8 → 后应仍为 8（本卡只读不写）
直接访问 /creative/ai-search → 占位页仍在
```

---

## 回滚方案

```powershell
git revert <本卡 commit>
```

纯前端、纯视觉与文案，无数据变更，无 schema 漂移。

---

## 纪律

- **本卡不产生任何数据**。验证全部使用现存数据（《美丽的一天》），**只读不写**
- 若因故需要探针，命名 `TASK710D-probe-*`，测完硬删并回报计数
- **禁止**为了验证 `initial` 文案去改《美丽的一天》的手记内容
- 删入口前先定性：本卡摘除「AI 搜索」总览入口属**归位**（该能力并入外来参考），不是废弃——`AiSearchPage` 与路由**都留着**

---

## 回报格式

- 做了什么、改了哪些文件
- 来源区截图或文字描述（三块、可点性对比）
- 两种 kind 的弹窗文案**各确认一次**
- 《美丽的一天》WorkNote 前后计数
- 风险或异议

---

## 异议预留

- 「进入 →」这类具体文案与样式，Cursor 可自行拿捏，**回报即可**
- 若你认为 AI 讨论灰卡应该写得更具体（如「创思讨论 · 开发中」而非纯 `AI_FROZEN_LABEL`）→ 可提，但**不要加"即将上线"这类承诺性文案**
- 若发现总览之外还有链到 `/creative/ai-search` 的入口（与侦察 J-7 冲突）→ **停手回报**
