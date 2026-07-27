# 三问题执行指令（P0 → P1）

> 作战场景：司令官已拍板 → 前线指挥官(Cursor) 执行
> 分支：`v2-dev`（VPS `/root/novel-writer`）
> 验证：每项改完后 `npm run build` 无 error

---

## P0 — Issue 2：Back Button 高亮错误

### 根因
`Layout.tsx:50` 企划课 match 包含 `'/work'`，而 `getActivePhase` 用 `PHASES.find` 按数组顺序匹配 → `/work/:id` 永远先命中企划课。

### 改动清单

#### 2a. `frontend/src/components/Layout.tsx:50`
从 planning match 移除 `/work`：
```
match: ['/planning', '/projects'],
```

#### 2b. `frontend/src/components/Layout.tsx:92-93`
`getActivePhase` 增强：对 `/work/` 路径按 `?from=` 查询参数分桶。

在 `getActivePhase` 函数最前面加 /work/ 拦截分支：
```typescript
const getActivePhase = (pathname: string): Phase | undefined => {
  // /work/:id 跨阶段详情 — 按 ?from= 查询参数分桶
  if (pathname.startsWith('/work/')) {
    const params = new URLSearchParams(location.search)
    const from = params.get('from')
    if (from === 'writing') return PHASES.find(p => p.id === 'writing')
    if (from === 'planning') return PHASES.find(p => p.id === 'planning')
    return undefined  // 无 ?from= 时不高亮任何 Tab
  }
  return PHASES.find(phase => phase.match.some(m => matchesPath(pathname, m)))
}
```

注意：需要在函数参数中或函数内获取 `location.search`。由于 `getActivePhase` 当前是纯函数，考虑改为从 `useLocation()` 取 search 后传入，或直接在组件内内联逻辑。

**推荐实现方式**：把 `/work` 的拦截逻辑从 `getActivePhase` 移到 `Layout` 组件内部，读取 `location.search` 后做判断：

```typescript
// Layout 组件内，替换原有 getActivePhase(pathname)
const getActivePhase = useCallback((pathname: string): Phase | undefined => {
  if (pathname.startsWith('/work/')) {
    const params = new URLSearchParams(location.search)
    const from = params.get('from')
    if (from === 'writing') return PHASES.find(p => p.id === 'writing')
    if (from === 'planning') return PHASES.find(p => p.id === 'planning')
    return undefined
  }
  return PHASES.find(phase => phase.match.some(m => matchesPath(pathname, m)))
}, [location.search])
```

#### 2c. `frontend/src/components/Layout.tsx:106-112` — 子导航

`from=writing` 时进入 `/work/` 不应显示企划课的子导航 `from=planning` 时正常显示。在 `visibleSubNav` 逻辑中加判断：
```typescript
const visibleSubNav =
  activePhase?.sub.filter(item => {
    if (pathname.startsWith('/work/') && activePhase?.id === 'writing') {
      return false  // 创作室详情页不显示子导航（创作室本身只有 1 个子项）
    }
    if (!aiPartner && (item.path === '/creative/ai-search' || item.path === '/creative/chat')) {
      return false
    }
    return true
  }) ?? []
```

#### 2d. 6 处 navigate 补充 `?from=` 参数

| 文件 | 行号 | 当前 | 改为 |
|------|------|------|------|
| `WritingEditorPage.tsx` | ~244 | `` navigate(`/work/${projectId}`) `` | `` navigate(`/work/${projectId}?from=writing`) `` |
| `WritingEditorPage.tsx` | ~288 | 同上（无章节时返回按钮） | 同上 |
| `WritingEditorPage.tsx` | ~313 | 同上（章节列表为空时） | 同上 |
| `WritingProjectsPage.tsx` | ~44 | `` navigate(`/writing/${id}`) `` | → → → 先确认不涉及 |
| `PlanningProjectsPage.tsx` | ~45 | `` navigate(`/work/${id}`) `` | `` navigate(`/work/${id}?from=planning`) `` |
| `ProposalEvalPage.tsx` | ~69, ~183 | `` navigate(`/work/${id}`) `` | `` navigate(`/work/${id}?from=planning`) `` |

注意 `WritingProjectsPage.tsx` ~44 导航到 `/writing/${id}` 而不是 `/work/${id}`，本身不走 `/work/` 路径，无需改。

#### 2e. 特殊项目卡片导航
搜索所有其他 `navigate('/work/...')` 调用（dashboard、项目卡片等），按场景补充 `?from=`。无明确阶段归属的用 `?from=planning` 做默认（向后兼容）。

---

## P0 — Issue 3：Pure 编辑器

### 改动清单

#### 3a. `frontend/src/pages/WritingEditorPage.tsx:14`
```typescript
// 改前
type EditorMode = 'pure' | 'reference' | 'ai' | 'review'
// 改后
type EditorMode = 'pure' | 'reference'
```

#### 3b. 移除 AI / 审阅 ModeButton
删除以下行：
- AI ModeButton（~366-372）
- 审阅 ModeButton（~373-378）
- 保留「写作」和「参考」按钮

#### 3c. 移除 AI / 审阅 panel
删除以下 panel 渲染：
- AIAssistantPanel（~433-441 区域）
- ReviewPlaceholder（~442-444 区域）
- 保留 ReferenceSidebar（~430-433 区域）

只保留：
```typescript
{editorMode !== 'pure' && (
  <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm" />
)}
{editorMode === 'reference' && projectId && (
  <ReferenceSidebar projectId={projectId} width={referenceWidth} />
)}
```

#### 3d. 移除 AI 相关代码
- 删除 `import AIAssistantPanel from '../components/writer/AIAssistantPanel'`
- 删除 `ReviewPlaceholder` 内联组件（~37-54）
- 删除 `handleApplyAIContent` 回调（~253-258）
- 删除 `aiWriter` 相关的 effect/state
- 删除 `useSettingsStore` 中对 `aiWriter` 的读取

#### 3e. 移除元数据弹窗
- 删除 `ContentMetadataCard` 弹窗（~454-482）
- 删除 `showProjectMetadata` 相关 state
- `ProjectNavigationPanel` 不传 `onProjectSettings`（或设为空函数）

#### 3f. 清理 import
检查清理后的文件中不再使用的 import：
- `ContentMetadataCard` — 若弹窗移除则可删
- `AIAssistantPanel` — 直接删
- 检查 `useEffect` 中 `aiWriter` 相关副作用

#### 3g. 确认 `handleGoBack` 已带 `?from=writing`
Issue 2 的 2d 已覆盖此项，确保 `navigate` 调用带 query。

---

## P1 — Issue 1：字面量 + 类型清扫

### 改动清单

#### 1a. `frontend/src/pages/planning/MetadataListPage.tsx:35`
补全 v4.1 状态过滤：
```typescript
// 改前
['planning','writing','reviewing','completed','archived']
// 改后
['planning','planned','writing','written','reviewing','reviewed','archived']
// 保留 'completed' 作 legacy 兜底（可选）
```

#### 1b. `frontend/src/services/api.ts:672-681`
`chaptersApi.updateMetadata` 中加 notes 分支：
```typescript
async updateMetadata(chapterId: string, field: string, content: string) {
  if (field === 'notes') {
    return await this.update(chapterId, { notes: content })
  }
  if (field === 'synopsis') {
    return await this.update(chapterId, { summary: content })
  }
  // ... 原有 metadata 逻辑
}
```

#### 1c. `backend/src/types/metadata.ts`
- 删除 `ProjectMetadata.writingStyle`（已上提为 `schema.prisma:44` 顶层字段）
- `ChapterMetadata.notes` 标 `/** @deprecated 已迁至 Chapter.notes 顶层字段 */`

#### 1d（可选）`frontend/src/components/chapters/ChapterManager.tsx:149`
`getStatusColor` 中 `'completed'` 改为映射到 `'written'` 的颜色：
```typescript
// 改前
case 'completed':
  return 'bg-green-100 text-green-700 border-green-200'
// 改后（保留 completed 兜底，但映射到 written 色）
case 'completed':
case 'written':
  return 'bg-green-100 text-green-700 border-green-200'
```

---

## 验证要求

每项改完后：
1. `npm run build`（无 error）
2. 改前改后 diff 确认无意外删除
3. 特别关注：Issue 2 的 `?from=` 参数缺失时默认行为（fallback 不高亮 vs 退化为企划课）

---

## 执行顺序

```
Step 1: Issue 2 — Layout.tsx 增强（2a, 2b, 2c）
Step 2: Issue 2 — 6 处 navigate 补 query（2d, 2e）
Step 3: Issue 3 — Pure 编辑器（3a~3g）
Step 4: npm run build
Step 5: Issue 1 — 字面量清扫（1a~1d）
Step 6: npm run build（最终）
```
