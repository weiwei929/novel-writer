# P1-C1 执行规范：入口文案统一

> **基线**：`v2-dev` @ `c6fa708`
> **范围**：仅 2 文件，~3-4 行，纯文案替换
> **设计原则**：P1 原则 4（创意组不进入 WDP）+ 入口文案部门化

---

## 一、执行步骤

共 2 处文件、3 个替换点，可一次性 stage + commit。

### 修改 1 — ProposalEvalPage.tsx L151

**位置**：`frontend/src/pages/planning/ProposalEvalPage.tsx`，L144-152 区块

**说明**："已接收入企划课"提示区块内的按钮文案

**旧代码**：
```tsx
            >
              查看作品
            </button>
```

**新代码**：
```tsx
            >
              查看企划进度
            </button>
```

| 字段 | 旧值 | 新值 |
|------|------|------|
| 按钮文案 | "查看作品" | "查看企划进度" |
| `onClick` | 不变 | — |
| 所在条件 | `proposal.status === 'approved' && proposal.projectId` | 不变 |

---

### 修改 2 — WritingEditorPage.tsx L322

**位置**：`frontend/src/pages/WritingEditorPage.tsx`，L315-324 区块——"请选择要编辑的章节"空态下的按钮

**旧代码**：
```tsx
           >
            返回作品详情
          </button>
```

**新代码**：
```tsx
           >
            返回创作室
          </button>
```

| 字段 | 旧值 | 新值 |
|------|------|------|
| 按钮文案 | "返回作品详情" | "返回创作室" |
| `onClick` | `navigate(\`/work/${projectId}\`)` | 不变 |

---

### 修改 3 — WritingEditorPage.tsx L337

**位置**：`frontend/src/pages/WritingEditorPage.tsx`，L333-340 区块——顶栏"返回"按钮的 title

**旧代码**：
```tsx
             title="返回作品详情"
```

**新代码**：
```tsx
             title="返回创作室"
```

| 字段 | 旧值 | 新值 |
|------|------|------|
| `title` | "返回作品详情" | "返回创作室" |
| `onClick` | `handleGoBack` | 不变 |

---

## 二、不修改清单（out-of-scope）

| 文件/模块 | 理由 |
|-----------|------|
| `ShelfPage.tsx` | P1-C2 范围 |
| `ProjectCard.tsx` | 不纳入 P1-C |
| `App.tsx` / `Layout.tsx` | 不相干 |
| `WorkDetailPage.tsx` | P0-A 已加固，不改 |
| 任何后端/API | 不改 |
| 任何逻辑、类型、路由 | 纯文案替换 |

---

## 三、验收标准

- [ ] `ProposalEvalPage.tsx`"查看作品"已改为"查看企划进度"
- [ ] `WritingEditorPage.tsx` 两处"返回作品详情"已改为"返回创作室"
- [ ] 以上 2 文件外**零变更**
- [ ] `tsc -b && vite build` 通过
- [ ] commit message: `fix(frontend): standardize entry labels across departments`

---

## 四、回报格式

```
## staged diff stat
{git diff --staged --stat 输出}

## staged name-only（夹带检查）
{git diff --staged --name-only 输出}

## diff 摘要
| 修改 | 内容 | 行数 |
|------|------|------|
| 修改 1 | ProposalEvalPage "查看作品"→"查看企划进度" | -1/+1 |
| 修改 2 | WritingEditorPage L322 "返回作品详情"→"返回创作室" | -1/+1 |
| 修改 3 | WritingEditorPage L337 title 同上 | -1/+1 |

## staged-only build
{tsc -b && vite build 结果}

## 是否夹带
{是/否}
```
