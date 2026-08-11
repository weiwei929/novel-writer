# TASK-710-C: 素材明链（引用可写与跟随）

> **状态**：⚡ 执行中 · 创建 2026-08-03
> **模式**：小卡 · 前后端协作 · **无 Schema 变更**
> **架构师**：Claude（参谋长）
> **操作员**：Antigravity Agent
> **上游**：[TASK-710](./TASK-710-creative-seed-chain.md) 结论 4/5/10 · [710-A](./TASK-710-A-dark-chain-removal.md) · 侦察 [710-S](./TASK-710-S-cursor-scout.md) 异议 7
> **基线**：710-A / 710-B / 710-D 之后（HEAD @ `03bb086`）

---

## 背景

在 710-A 删除了隐式物化正文的“暗链”之后，提案与素材之间的显式引用链（明链）需要被正式建立：
1. `ReferencePicker.tsx` 之前由于入口丢失变成孤儿组件，且过滤条件排除掉了初始状态为 `none` 的外来参考。
2. 提案详情页缺乏“+ 引用素材”的操作按钮和已引用素材的展示区域。
3. `acceptIntoPlanningCore`（立项接收入企划课）时，提案中的引用素材快照需要跟随复制到 Project metadata 中，供后续作品详情侧只读查阅。

---

## 假设与设计共识

1. **单向快照，事后不回流**：素材引用是单向关联快照，后期的素材修改不反向同步到已立项的作品中。
2. **零 Schema 变更**：不新增任何物理表，后端 `Proposal.references` 为 JSON/关联，Project metadata 中存 `attachedReferences` 数组。
3. **取消冗余过滤**：`ReferencePicker` 中显示所有可用素材与外来参考，不以 `processingType` 拦人。

---

## 范围

### 可改文件

| 路径 | 动作 |
|---|---|
| `frontend/src/components/creative/ReferencePicker.tsx` | 修复 `f.filter` 逻辑，允许选取任意 `FileReference` |
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 接入 `ReferencePicker` 弹窗与按键，展示已引用素材列表，保存时同步 payload |
| `backend/src/routes/proposals.ts` | 立项时复制 `proposal.references` 到 Project metadata（`attachedReferences`） |
| `frontend/src/pages/WorkDetailPage.tsx` | 在作品详情只读展示立项时跟随的引用素材（如存在） |

---

## 操作步骤

1. **修复 `ReferencePicker.tsx` 过滤**：移除 `processingType === 'complete'` 的强制过滤，设 `setFiles(f)`。
2. **接入 `ProposalDetailPage.tsx`**：
   - 添加 `[showPicker, setShowPicker] = useState(false)` 与 `[references, setReferences] = useState<ProposalReference[]>([])`。
   - `load()` 时填充提案既有 `references`；
   - 在“基础信息”下方或侧栏展示“引用素材”区域，提供“+ 引用素材”按钮和图标卡片；
   - `buildProposalPayload` 中保留 `references` 字段。
3. **后端 `proposals.ts` 立项跟随**：
   - 在 `acceptIntoPlanningCore` 处理 Project 创建的 metadata 时，将 `proposal.references` 写入 `attachedReferences`。
4. **作品详情页 `WorkDetailPage.tsx` 查阅**：
   - 在作品信息/概览区支持展示 `attachedReferences` 列表（若存在）。

---

## 验证计划

1. `npm run test` (backend)：通过现有所有测试（5/5 PASS）。
2. `npm run lint` (backend & frontend)：类型检查零报错。
3. `npm run build` (frontend)：前端构建无 error。
