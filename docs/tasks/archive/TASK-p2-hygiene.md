# TASK-P2-HYGIENE：WorkDetailPage 上下文守卫修复

> **来源**：全管线审计 ⚠️ 项 #1/#2/#3
> **类型**：上下文治理 hygiene 修复
> **约束**：
>   - ✅ 只改 `WorkDetailPage.tsx`
>   - ❌ 不改变任何状态流、端点、文案、路由
>   - ❌ 不新增功能
>   - ❌ 不碰 Review/Reader/schema/chapter notes
>   - ❌ 不处理 legacy `completed` / 后端白名单 / undo-written UI

---

## 修改目标（3 处，均在同一文件）

### ① `case 'planning'` 上下文守卫

**位置**：`renderActions` 的 `case 'planning'`（约 L366）

**现状**：`confirmGreenlight` 的"确认企划完成"按钮无条件渲染。

**问题**：非企划上下文（writing/editorial/library）也能看到该按钮。

**修复**：加 `isPlanningContext` 守卫：

```typescript
case 'planning':
  return (
    <>
      <button
        onClick={() => setShowPlanning(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border ..."
      >
        <IconList size={14} />
        管理章节规划
      </button>
      <button
        onClick={() => setShowMetadataEditor(true)}
        className="px-3 py-1.5 text-sm border ..."
      >
        编辑元数据
      </button>
      {isPlanningContext && (
        <button
          type="button"
          disabled={transitionLoading}
          onClick={() =>
            void handleStageAction('确认企划完成', () =>
              projectsApi.confirmGreenlight(project.id)
            )
          }
          className="px-3 py-1.5 text-sm bg-emerald-600 ..."
        >
          确认企划完成
        </button>
      )}
      {stageManageButton}
    </>
  )
```

只包 "确认企划完成" 按钮，不包 "管理章节规划" 和 "编辑元数据"（这些在非企划上下文也可能有用）。

---

### ② 章节列表「写作」按钮上下文守卫

**位置**：章节列表内（约 L679）

**现状**：
```typescript
{!isPlanningContext && (
  <button onClick={...navigate(`/writing/${project.id}/${c.id}`)}>
    写作
  </button>
)}
```

**问题**：`!isPlanningContext` 导致 editorial/library 上下文也显示跳转编辑器的"写作"入口。

**修复**：改为 `!isPlanningContext && !isEditorialContext && !isLibraryContext`

```typescript
{!isPlanningContext && !isEditorialContext && !isLibraryContext && (
  <button onClick={...navigate(`/writing/${project.id}/${c.id}`)}>
    写作
  </button>
)}
```

**语义等价表**：

| `from` | 之前 | 之后 | 正确性 |
|--------|------|------|--------|
| `writing` | 显示 | 显示 | ✅ 创作室可写作 |
| `planning` | 隐藏 | 隐藏 | ✅ 企划课不写作 |
| `editorial` | 显示 | 隐藏 | ✅ 编审部不写作 |
| `library` | 显示 | 隐藏 | ✅ 文集库不写作 |
| 无 `from`(legacy) | 显示 | 显示 | ✅ 保守维持原行为 |

---

### ③ `StageTransitionModal` 渲染守卫

**位置**：文件末尾（约 L768）

**现状**：
```tsx
{!isPlanningContext && (
  <StageTransitionModal .../>
)}
```

**问题**：writing/editorial/library 上下文仍可能挂载 Modal 组件。

**修复**：排除所有四个部门上下文：

```typescript
{!isPlanningContext && !isWritingContext && !isEditorialContext && !isLibraryContext && (
  <StageTransitionModal .../>
)}
```

---

## 影响范围

| 文件 | 变更 | 行数 |
|------|------|------|
| `WorkDetailPage.tsx` | 3 处条件表达式修改 | ~5 行增量 |

**零新依赖，零后端变更，零功能变化。**

---

## 不变量检查

- [ ] 只修改了 `WorkDetailPage.tsx`
- [ ] 未改动 `api.ts` / `statusLabels.ts` / 路由 / 后端
- [ ] 未改动 `ReviewDetailPage` / `EditorialPage` / `LibraryDetailPage` / `ChapterPlanningEditor`
- [ ] 三个修改均为条件表达式收紧，无逻辑重构
- [ ] `case 'planning'` 的"管理章节规划"和"编辑元数据"保持无条件渲染
- [ ] 无 `from` 的 legacy 入口行为不变
- [ ] staged-only `npm run build` 通过

---

## 执行方式

Cursor 可二选一：
1. 直接做 staged diff，只 `git add WorkDetailPage.tsx`
2. 或先回报计划，经确认后再执行

**commit 命名建议**：
```
fix(frontend): tighten work detail department context guards
```
