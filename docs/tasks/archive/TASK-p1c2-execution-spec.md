# P1-C2 执行规范：ShelfPage source → from 派生

> **基线**：`v2-dev` @ `288c300`（P1-A + P1-B + P1-C1 后）
> **范围**：仅 `frontend/src/pages/ShelfPage.tsx`，1 文件
> **预计 diff**：~12-16 行
> **设计原则**：P1 原则 7（ShelfPage 暂存池综合设计）+ P1 原则 4（创意组不进入 WDP）

---

## 一、概要

ShelfPage 中每个暂存项（`ShelvedProjectCard`）的标题当前是裸链 `/work/${project.id}`，无 `from=`。
改为：从每个暂存项的 `shelved.source`（`metadata._shelved.source`）派生 `from` 参数。

- 可安全映射的 source → 带 `?from=` 的 WDP 链接
- 无法安全映射的 source → 标题不可点（纯 `<span>`）

---

## 二、执行步骤

### 步骤 1：新增 `deriveWdpFrom` 函数

**位置**：在 `ShelfPage.tsx` 中，`SOURCE_LABELS` 对象（L18-26）之后，`formatRelativeTime` 函数之前。

**添加代码**：
```typescript
/** 从 shelved.source 派生 WDP from 参数。无法安全映射时返回 null，标题不可点 */
function deriveWdpFrom(source?: string): string | null {
  switch (source) {
    case 'planning': return 'planning'
    case 'writing':  return 'writing'
    case 'review':   return 'editorial'
    case 'library':  return 'library'
    default:         return null
    // creative / project_card / stage_transition / undefined → null → 不可点
  }
}
```

**source → from 映射说明**：

| shelved.source | from 值 | 进入 WDP 上下文 | 理由 |
|----------------|---------|----------------|------|
| `planning` | `planning` | ✅ 企划课 | 暂存来源明确 |
| `writing` | `writing` | ✅ 创作室 | 暂存来源明确 |
| `review` | `editorial` | ✅ 编审部 | source 名称 review，WDP 上下文 editorial，映射正确 |
| `library` | `library` | ✅ 文集库 | 暂存来源明确 |
| `creative` | `null` | ❌ 不可点 | 原则 4：创意组不进入 WDP |
| `project_card` | `null` | ❌ 不可点 | 来源不确定（可能来自任意部门），无安全上下文 |
| `stage_transition` | `null` | ❌ 不可点 | 同上 |
| undefined/missing | `null` | ❌ 不可点 | 旧数据无记录，降级保护 |

---

### 步骤 2：在 `ShelvedProjectCard` 中消费

**位置**：`ShelvedProjectCard` 组件内部，L50 之后（`const shelved = getShelvedMeta(project)` 之后）

**添加一行**：
```typescript
const from = deriveWdpFrom(shelved.source)
```

**然后**：将标题的 `<Link>`（L66-71）改为条件渲染：
```tsx
{from ? (
  <Link
    to={`/work/${project.id}?from=${from}`}
    className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
  >
    {project.title}
  </Link>
) : (
  <span className="text-lg font-semibold text-gray-400 truncate">
    {project.title}
  </span>
)}
```

**改动说明**：

| 项目 | 旧代码 | 新代码 |
|------|--------|--------|
| `from` 值 | 无 | 从 `deriveWdpFrom(shelved.source)` 派生 |
| `to` | `/work/${project.id}` | `/work/${project.id}?from=${from}`（仅当 from 非 null）|
| 不可点情况 | 无（全可点） | `creative`/`project_card`/`stage_transition`/undefined → `<span>` |
| 不可点样式 | — | `text-gray-400`（视觉降级，与可点的 gray-900 区分）|

`Link` 和 `<span>` **以外的属性不变**（badge、来源文字、按钮等完全不动）。

---

## 三、不修改清单（out-of-scope）

| 文件/模块 | 理由 |
|-----------|------|
| `ProjectCard.tsx` | 已排除，无活跃调用方 |
| `App.tsx` / `Layout.tsx` / `WorkDetailPage.tsx` | 不相干 |
| 任何后端/API | 不改 |
| 任何其他文件 | 仅 ShelfPage.tsx |

---

## 四、验收标准

- [ ] `deriveWdpFrom` 函数已添加，映射表覆盖 4 个可映射 + 3 个不可映射 + 1 个 fallback
- [ ] `ShelvedProjectCard` 标题从 `<Link>` 改为条件渲染（from 非 null 时可点，否则不可点）
- [ ] 可点标题的 `to` 带 `?from=${from}` 参数
- [ ] 不可点标题使用 `<span>` 且样式与可点有区分
- [ ] 仅 1 文件变更，无夹带
- [ ] `tsc -b && vite build` 通过
- [ ] commit message: `fix(frontend): derive shelf from context from shelved.source`

---

## 五、回报格式

```
## staged diff stat
{git diff --staged --stat 输出}

## staged name-only（夹带检查）
{git diff --staged --name-only 输出}

## diff 摘要
| 修改 | 内容 | 行数 |
|------|------|------|
| 新增函数 | deriveWdpFrom | ~6 行 |
| 消费 | ShelvedProjectCard 条件渲染 | ~6 行 |

## staged-only build
{tsc -b && vite build 结果}

## 是否夹带
{是/否}

## 特殊验证
- 不可点 source（creative/project_card/stage_transition/undefined）标题是否渲染为 <span>？
- 可点 source 的 to 是否带 ?from=
```
