# 三问题讨论纲要 — Claude → Cursor

> 作战场景：架构参谋(Claude) → 前线指挥官(Cursor)
> 任务：对 M-Final 后遗留的三个问题进行 scouting + 方案讨论

---

## 背景

M-Final 已确认 8 步 API 全链路打通（planning → archived），创作室编辑器可访问。用户实测后提出三个残留问题，需三方（用户/Claude/Cursor）讨论后落地。

---

## Issue 1: 1.0 metadata 残留

### 已发现证据

| 位置 | 问题 | 严重度 |
|------|------|--------|
| `frontend/src/services/api.ts:160` | Chapter 类型定义仍有 1.0 三态 `'draft' \| 'writing' \| 'completed'`，M2 已锁为 `'draft' \| 'written'` | **高** — 类型不安全 |
| `frontend/src/services/api.ts:571-639` | `chaptersApi` 所有方法通过 `metadata.notes` 桥接 notes，但 M2 已将 notes 提升为 Chapter 顶层字段（Prisma 和路由都已改） | **高** — 数据不一致 |
| `frontend/src/components/chapters/ChapterManager.tsx:160` | 仍引用旧三态 `draft/writing/completed` | **中** |
| `backend/src/types/metadata.ts:14` | `ProjectMetadata` 仍有 `writingStyle` 字段，但 v4.1 已上提为 `Project.writingStyle` 顶层字段 | **低** — 类型定义，不影响运行时但误导 |
| `backend/src/constants/metadata-keys.ts` | `META_KEYS_DAY1` 整套系统字段（`_fromEvaluate`, `_sourceFrom`, `_proposalId`, `_planningPhase`, `_discussionSubmitted`, `_shelved`, `_rejectedAt`）在 5 个文件被 import | **需评估** — 部分可能仍有实际用途 |

### 需 Cursor 确认

1. **notes 桥接**：后端 Prisma Chapter 已有 `notes String?` 独立字段，路由 `chapters.ts` 也已支持。前端 `api.ts` 的 `metadata.notes` 桥接是否应全部移除，直接发 `notes` 字段？
2. **META_KEYS_DAY1**：哪些键还在被实际使用（如 `_shelved` 用于软删恢复）？哪些可以标记为 legacy 只读？
3. **Chapter.status 类型**：`api.ts:160` 的三态改为 `'draft' | 'written'` 是否安全？搜索所有引用的地方一并更新。
4. **`ProjectMetadata.writingStyle`**：是否仍被代码引用还是纯类型冗余？

---

## Issue 2: 阶段边界 / Back Button 路由到企划课

### 根因

`frontend/src/components/Layout.tsx:50`:
```
match: ['/planning', '/projects', '/work'],
```

`/work` 在企划课的 match 数组中。编辑器返回按钮 `navigate('/work/:projectId')` 时，Layout 高亮的是"企划课"而非"创作室"。

### 当前路由设计

```
企划课:   match: ['/planning', '/projects', '/work']
创作室:   match: ['/writing', '/editor']
```

编辑器在 `/writing/:projectId/:chapterId` — 创作室 match 正确。
但 `/work/:projectId`（WorkDetailPage）被匹配到企划课。

### 需 Cursor 确认

1. `/work/:projectId` 应归哪个阶段？它展示的是 WorkDetailPage（含章节列表/预览/状态操作），按 day1-design 属于创作室范畴。
2. 如果把 `/work` 从企划课 match 移除，加入创作室 match，创作室的 match 将变为 `['/writing', '/editor', '/work']` —— 是否可行？
3. 是否有其他路由依赖 `/work` 在企划课的匹配？
4. 编辑器返回按钮的目标是否应该改为 `/writing/projects`（创作室列表）而非 `/work/:projectId`？或者保持 `/work/:projectId` 但归创作室高亮？
5. 有无必要将 WorkDetailPage 的规范 URL 改为 `/writing/:id`（即写作阶段的详情页统一在 `/writing/` 下）？

---

## Issue 3: 编辑器布局 — Mode Buttons 未匹配最新设计

### 当前实现

`frontend/src/pages/WritingEditorPage.tsx:360-384`：
```
[写作] [参考] [AI] [审阅]  |  [保存]
```
四个 ModeButton 加一个保存按钮。

### day1-design.md §6.4 + overall-architecture.md v4.1 设计要求

- **编辑器 pure-ified**：移除 AI 助手、审阅、状态下拉、作品级操作
- **参考侧栏**（§5.8）：唯一允许的侧栏面板，含 5 板块（本幕概要/角色速查/地点速查/写作风格/笔记备忘）
- 笔记备忘（`Chapter.notes`）是唯一可编辑的侧栏板块

### 需 Cursor 确认

1. AI 按钮和审阅按钮应移除（符合 pure 设计）
2. 参考侧栏是否应该作为默认打开的右侧面板，还是通过一个 toggle 按钮切换？
3. 当前代码中 `editorMode` 的 `'pure' | 'reference' | 'ai' | 'review'` 类型定义需要精简为 `'pure' | 'reference'`
4. `AIAssistantPanel`, `ReviewPlaceholder` 等组件引用需要清理
5. 保存按钮是始终显示还是只在有改动时显示？当前行为似乎 OK。

---

## 行动要求

1. **Scout**：对上面三个问题的每个子项，检查代码实际状态，确认发现是否准确
2. **分析**：对 Issue 2 的 5 个问题给出具体建议（修改方案 + 风险）
3. **方案**：对 Issue 1 + Issue 3 给出最少改动的修复方案
4. **报告**：用 bullet point 格式输出，每条含文件路径 + 行号 + 建议修改

格式示例：
```
ISSUE-1a: frontend/src/services/api.ts:160
  - 当前: status: 'draft' | 'writing' | 'completed'
  - 改为: status: 'draft' | 'written'
  - 影响: 需同步更新 X 个引用文件（见 grep 结果）
  - 风险: 无，仅类型定义，后端已锁
```
