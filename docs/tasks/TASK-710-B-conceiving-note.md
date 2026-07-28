# TASK-710-B: 构思笔记 + 清理无消费者字段

> **状态**：⏳ 待授权 · 创建 2026-07-28
> **模式**：小卡 · **前端为主**（+ backend 一行）· **无 schema 变更**
> **架构师**：Claude（参谋长）
> **操作员**：Cursor IDE
> **上游**：[TASK-710](./TASK-710-creative-seed-chain.md) 结论 2 / 12 · 侦察 [TASK-710-S](./TASK-710-S-cursor-scout.md) J-2、J-4、异议 8
> **基线**：710-A 之后（`24bfbef` 或更新）
> **可与 [710-D](./TASK-710-D-source-realign.md) 并行**（无文件重叠）

---

## 背景

创意组「构思」阶段现在**只剩一张表单**——留不下想法。

`ProposalDetailPage` 底部有一块「构思评估记录」只读面板，读 `metadata._evaluation`。但该字段的**唯一写入方在孤儿文件 `CreativeDiscussion.tsx` 里**（自 2026-06-12 `18939aa` 零引用），所以这块面板**恒空**——实测两条现存提案均无有效 `_evaluation`。

同时，详情页在静默读写三个**无人消费**的字段。本卡一并清掉。

---

## 假设（已声明）

1. **构思笔记 = 复活 `_evaluation` 的输入口**，不新建字段、不新建表。写入沿用现有「保存」按钮，不加自动保存。
2. **`_evaluation` 允许为空**。提交企划课的门槛不变（标题 + 梗概必填），构思笔记始终可留空。
3. **`innovation` / `coreSetting` 只停写，不清旧值、不删数据库列。**侦察实测《美丽的一天》提案里存有 `innovation: "哈哈哈，瞅瞅？"` —— 停写后该值留在库里但不再回写。要清旧值需另行拍板。
4. **`_tags` 只停写，不清旧值。**`buildProposalPayload` 用 `...meta` 展开，移除 `_tags: tags` 后，服务端已有的 `_tags` 会被原样保留——这是期望行为。
5. **标签移除是可见改动**（结论 12 修正）：详情页会少一个输入控件。**不是零影响，审卡时别按"删了没人看见"处理。**
6. `TagInput` / `TagFilterBar` **组件本身不删**——`ScrapNote`、`ExternalRefs` 仍在用。
7. Windows lint 撞 DLL 锁时：frontend `npm run lint`，backend `npx tsc --noEmit`。

---

## 范围

### 可改

| 路径 | 动作 |
|---|---|
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 加构思笔记输入框；删只读评估面板；停写三字段 |
| `frontend/src/services/creativeOrigin.ts` | `advanceOriginToConceiving` 同步调整字段 |
| `backend/src/routes/proposals.ts` | 一行：空 `_evaluation` 不再复制进 Project |

### 只读参考

- `frontend/src/services/api.ts`（`ProposalMetadata` 类型）
- `frontend/src/components/creative/CreativeDiscussion.tsx`（**孤儿，只作抄写参考，不复活、不修改**）

## 不做什么

- 不动状态机、不动 `_creativeStage` 三段
- 不改提交企划课门槛
- 不删 `TagInput` / `TagFilterBar` 组件
- 不碰 `Scrap.tags` / `FileReference.tags` / `Project.tags`
- 不删数据库列、不写 migration
- 不复活 `CreativeDiscussion.tsx` 或 `ReferencePicker.tsx`（后者是 710-C）
- **不补引用材料**——「带不进素材」仍是 710-C 的活

---

## 操作步骤

### 1. 加构思笔记（`ProposalDetailPage.tsx`）

**1a.** 新增 state：`const [evaluation, setEvaluation] = useState('')`

**1b.** `load()` 中回填：`setEvaluation(meta._evaluation ?? '')`

**1c.** **插入位置：「基础信息」`<section>` 之后、「设定雏形」`<section>` 之前**，新起一个同款 section：

```tsx
<section className="bg-white border rounded-xl p-5 space-y-2">
  <div>
    <h2 className="text-sm font-semibold text-gray-800">构思笔记</h2>
    <p className="text-xs text-gray-500 mt-1">
      为什么想写这个、主角大概是谁、参考了什么——写给自己看的幕后记录。
      立项后会随作品一起带进企划课。
    </p>
  </div>
  <textarea
    className={inputCls}
    rows={8}
    value={evaluation}
    onChange={e => setEvaluation(e.target.value)}
    placeholder="记录构思过程…（可留空）"
  />
</section>
```

**1d.** **删除**底部原「构思评估记录」只读 section（当前 `:295–300`，`{meta._evaluation || '（无评估记录）'}` 那块）。

**1e.** `buildProposalPayload` 的 `metadata` 中加 `_evaluation: evaluation`，**同时删掉 `_tags: tags`**：

```ts
metadata: {
  ...meta,
  _evaluation: evaluation,
  _settingSketch: normalizeWorkSetting(settingSketch),
}
```

**1f.** 依赖数组补 `evaluation`，去掉 `tags` / `innovation` / `coreSetting`。

### 2. 停写三字段

**2a.** `ProposalDetailPage.tsx`：删除 `innovation` / `coreSetting` / `tags` 三组 state、`load()` 中三处回填、payload 中三处字段、以及「基础信息」里的 `<TagInput>` 与其 label。

**2b.** `creativeOrigin.ts` → `advanceOriginToConceiving`：

- 入参 `fields` 去掉 `innovation` / `coreSetting` / `tags`，**加 `evaluation: string`**
- 写入体去掉 `innovation` / `coreSetting` / `_tags`，**加 `_evaluation: fields.evaluation`**

> **为什么必须加**：「开始创意构思」是一次独立提交，不走 `handleSave`。不带上 `evaluation`，用户填了笔记再点这个按钮就会丢。

**2c.** `createConceivingProposal`：去掉 `_tags: []`。

**2d.** `ProposalDetailPage` 中 `handleStartConceiving` 的调用参数同步。

### 3. 空 `_evaluation` 不再污染 Project（backend 一行）

`backend/src/routes/proposals.ts`，`projectMetadata` 构造处：

```ts
// 改前：空字符串也会被复制（侦察实测 projectEval: ""）
...(metadata._evaluation !== undefined ? { _evaluation: metadata._evaluation } : {}),

// 改后：非空才复制
...(typeof metadata._evaluation === 'string' && metadata._evaluation.trim()
  ? { _evaluation: metadata._evaluation }
  : {}),
```

### 4. 门禁

```powershell
cd D:\workspace\content\docs\novel-writer\frontend
npm run lint
npm run build
cd ..\backend
npx tsc --noEmit
npm test
```

---

## 预期结果

- 提案详情页「基础信息」下方出现**构思笔记**输入框，可写、可存、刷新仍在
- 底部不再有恒空的「构思评估记录」只读块
- 「标签」输入框消失
- 立项后 Project metadata 里能看到构思笔记内容；**留空时不再写入 `_evaluation: ""`**
- 灵感碎片页 / 外来参考页的标签录入与筛选**照常工作**

---

## 验证方法（必须可执行）

```powershell
# 0) 无 schema 漂移
git diff -- backend/prisma/schema.prisma      # 预期：空
```

**1) 构思笔记往返**

```text
打开任意提案详情 → 填构思笔记 → 保存 → 刷新 → 内容仍在
```

**2) 「开始创意构思」不丢笔记（易漏，重点验）**

```text
新建 origin 阶段探针提案 → 填构思笔记 → 直接点「开始创意构思」（不先点保存）
预期：笔记仍在
```

**3) 空笔记不污染**

```text
探针提案不填笔记 → 提交 → 接收入企划课
预期：Project metadata 中无 _evaluation 键（不是 ""）
```

**4) 笔记随立项跟走**

```text
探针提案填笔记 → 接收入企划课
预期：Project metadata._evaluation 含该内容
```

**5) 标签移除未波及素材页**

```text
灵感碎片页：能打标签、能按标签筛选
外来参考页：同上
```

**6) 幽灵字段不再回写**

```text
打开《美丽的一天》对应提案 → 保存一次
预期：请求体中不含 innovation / coreSetting / _tags
      库里旧值 "哈哈哈，瞅瞅？" 仍在（本卡不清旧值）
```

---

## 回滚方案

```powershell
git revert <本卡 commit>
```

无 migration。已写入的 `_evaluation` 是 JSON 字段追加——回滚后界面不显示，**数据不丢**。

---

## 纪律

- 探针命名 `TASK710B-probe-*`；测完硬删并回报计数，**含关联 WorkNote 与误建 Project**
- **禁止污染**《美丽的一天》（Project 1 / WorkNote 8）与《新创意》。第 6 项验证只允许**读**与**保存一次**，不改内容
- 删控件前先定性：本卡删的「标签输入框」属**产品拍板去除**（结论 12），不是死代码清理

---

## 回报格式

- 做了什么、改了哪些文件
- 六项验证逐条结果
- 第 2 项（开始创意构思不丢笔记）**单独确认**
- 第 3 项 Project metadata 的实际键列表
- 探针清理计数；《美丽的一天》《新创意》前后计数
- 风险或异议

---

## 异议预留

- 构思笔记的 `rows={8}` 若在实际内容下显得太挤或太空，可调，**回报即可，不必等授权**
- 若发现 `advanceOriginToConceiving` 还有第二个调用方 → **停手回报**
- 若司令官希望连 `innovation` / `coreSetting` / `_tags` 的**旧值一并清库** → 需另行授权，本卡只停写
