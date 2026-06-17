# TASK-616-B-A3：创意组设定雏形 UI

**状态**：草案 · 待 Codex 审卡  
**基线**：`feature/workdetail-p1`（616-B-A2 已合并）  
**分支建议**：`feature/616-b-a3-setting-sketch-ui`（自 `feature/workdetail-p1` 切出）  
**依据**：`616-B-work-setting-minimal-model-draft.md` §5；`TASK-616-B-A2.md`「创意侧 UI 可另卡」

---

## 0. 只读核验（执行前必做，回报差异）

```bash
git branch --show-current
git log --oneline -3
grep -rn '_settingSketch' frontend/src backend/src
grep -rn 'coreSetting' frontend/src/pages/creative/ProposalDetailPage.tsx
```

**当前事实（起草时）**：

| 项 | 状态 |
|----|------|
| `ProposalMetadata._settingSketch` 类型 | ✅ `frontend/src/services/api.ts` |
| 立项复制 `_settingSketch` → `workSetting` | ✅ `backend/.../proposals.ts` + `workSetting.ts` |
| 创意组编辑 UI | ❌ 无；`ProposalDetailPage` 仅有 legacy `coreSetting` 单字段 |
| 企划课 `WorkSettingEditor` | ✅ 可复用 `WORK_SETTING_BLOCKS` / `normalizeWorkSetting` |

若 HEAD 与上表不符，先缩卡或改范围，再写代码。

---

## 目标

作者在创意组提案详情页可**可选**填写四块设定雏形，保存到 `Proposal.metadata._settingSketch`；提交企划课后，A2 已实现的立项继承逻辑自动带入企划课 `workSetting`。

---

## 范围

### P0：设定雏形编辑区（`ProposalDetailPage`）

- 新增区块「设定雏形（可选）」，四块与 `workSetting` 同构、同标签（复用 `WORK_SETTING_BLOCKS`）
- 读写 `metadata._settingSketch`；`handleSave` / 提交企划课前保存路径均带上 `_settingSketch`
- 文案明确：**全部可选**；不阻断「提交企划课」（标题+梗概门槛不变，本卡不改）
- 加载时从 `getProposalMetadata(proposal)._settingSketch` 初始化；空则四块空白

### P1：共享 helper（小）

- 在 `frontend/src/services/workSetting.ts`（或同级小文件）增加：
  - `getSettingSketch(metadata)` → `WorkSetting` 形态
  - `normalizeSettingSketch` 可内联复用现有 `normalizeWorkSetting`
- 保存：`proposalsApi.update(id, { metadata: { ...meta, _settingSketch: normalized } })`

### P2：与 legacy `coreSetting` 的关系

- **本卡不删** `coreSetting` 字段与 UI（避免夹带迁移）
- 可在设定雏形区加一行灰字说明：「企划课将优先继承下方四块；上方的核心设定为旧字段，逐步淡出」
- **禁止**保存时把四块自动写入 `coreSetting` 或 legacy 六字段

---

## 不做

- 不启动 616-C；不加章节/企划成熟度门槛
- 不改 `acceptIntoPlanningCore` 后端逻辑（A2 已做）
- 不改提交企划课的必填规则（仍仅流程层标题+梗概）
- 不删 `coreSetting`、不做 legacy 迁移
- 不新做独立路由页；仅在 `ProposalDetailPage` 落地
- 不动 Prisma schema
- 不扩展 `references[]`、自动拆章、AI 生成设定

---

## 文件候选

| 文件 | 要点 |
|------|------|
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 四块 UI + load/save `_settingSketch` |
| `frontend/src/services/workSetting.ts` | `getSettingSketch`（可选，几行即可） |
| `frontend/src/services/api.ts` | 仅当类型需补全时改 |

**明确不改**：`backend/**`、`WorkSettingEditor.tsx`、`PlanningInProgressPage.tsx`

---

## 验收

- [ ] 提案详情可编辑并保存四块设定雏形；刷新后仍在
- [ ] `metadata._settingSketch` 键名与后端 `seedWorkSettingFromSketch` 一致
- [ ] 仅填 1 块也可保存；提交企划课不被设定雏形拦截
- [ ] 有雏形的提案立项后，企划课 `workSetting` 对应块有内容（smoke：填「人物与关系」→ 立项 → 企划课可见）
- [ ] `npm run build`（frontend）通过
- [ ] diff 仅本卡列出的文件（± 极小类型补全）

---

## 回报格式

1. 只读核验结果（HEAD、与卡假设差异）
2. 做了什么 / 改了哪些文件
3. smoke 步骤与结果
4. 剩余风险或阻塞
5. **不 commit / 不 push**，除非司令部另行授权

---

## 风险边界

- `advanceOriginToConceiving` / `handleEnterPlanning` 若单独组 `metadata`，须合并保留 `_settingSketch`，避免覆盖丢失
- 与 `coreSetting` 并存可能造成作者困惑——靠文案区分，本卡不做数据合并
