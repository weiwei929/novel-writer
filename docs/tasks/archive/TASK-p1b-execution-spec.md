# P1-B 执行规范：创意组入口治理

> **基线**：`v2-dev` @ `135b04e`（P1-A 后）
> **承接路由裁定**：选项 A — `/planning/in-progress`
> **范围**：仅 `frontend/src/pages/creative/ProposalDetailPage.tsx` + `frontend/src/components/creative/PlanningProposal.tsx`
> **预计 diff**：2 文件，4-6 行
> **设计原则**：P1 原则 4（创意组不直接进入可操作 WDP）

---

## 一、执行步骤

共 3 处修改，可一次性 stage + commit。

### 修改 1 — ProposalDetailPage.tsx L143-147

**位置**：`frontend/src/pages/creative/ProposalDetailPage.tsx`，L140-148 区块

**变更**：`to` 从 `/work/${proposal.projectId}` 改为 `/planning/in-progress`，文案从"查看作品"改为"查看企划进度"

**旧代码**：
```tsx
          {proposal.projectId && (
            <Link
              to={`/work/${proposal.projectId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              查看作品
            </Link>
          )}
```

**新代码**：
```tsx
          {proposal.projectId && (
            <Link
              to="/planning/in-progress"
              className="text-sm text-blue-600 hover:underline"
            >
              查看企划进度
            </Link>
          )}
```

**改动**：
| 字段 | 旧值 | 新值 |
|------|------|------|
| `to` | `` `/work/${proposal.projectId}` `` | `"/planning/in-progress"` |
| 文案 | "查看作品" | "查看企划进度" |
| 条件 | `proposal.projectId &&` | 不变 |

---

### 修改 2 — PlanningProposal.tsx L150-152

**位置**：`frontend/src/components/creative/PlanningProposal.tsx`，L149-153 区块（"已评估" section）

**变更**：`to` 从 `/work/${p.projectId}` 改为 `/planning/in-progress`，文案从"查看作品"改为"查看企划进度"

**旧代码**：
```tsx
                {p.projectId ? (
                  <Link to={`/work/${p.projectId}`} className="text-xs text-blue-600 shrink-0">
                    查看作品
                  </Link>
```

**新代码**：
```tsx
                {p.projectId ? (
                  <Link to="/planning/in-progress" className="text-xs text-blue-600 shrink-0">
                    查看企划进度
                  </Link>
```

**改动**：
| 字段 | 旧值 | 新值 |
|------|------|------|
| `to` | `` `/work/${p.projectId}` `` | `"/planning/in-progress"` |
| 文案 | "查看作品" | "查看企划进度" |
| 条件 | `p.projectId ?` | 不变 |
| else 分支 | `查看提案` → `/creative/proposals/${p.id}` | 不变 |

---

### 修改 3 — PlanningProposal.tsx L55 toast

**位置**：`frontend/src/components/creative/PlanningProposal.tsx`，handleEvaluate 内 L55

**变更**：toast 文案不再暴露 `/work/` 路径

**旧代码**：
```tsx
        success('已同意立项', `作品已创建，可前往 /work/${result.projectId}`)
```

**新代码**：
```tsx
        success('已接收入企划课', '企划课可查看处理')
```

**改动**：
| 字段 | 旧值 | 新值 |
|------|------|------|
| title | "已同意立项" | "已接收入企划课" |
| description | ``作品已创建，可前往 /work/${result.projectId}`` | "企划课可查看处理" |

---

## 二、不修改清单（out-of-scope）

| 文件/模块 | 理由 |
|-----------|------|
| `ProjectCard.tsx` | P1-C 范围 |
| `ShelfPage.tsx` | P1-C 范围 |
| `App.tsx` 旧路由 | 标记废弃，暂不删除 |
| `Layout.tsx` 侧栏 | 不影响 |
| `WorkDetailPage.tsx` | P0-A 已加固，不改 |
| `HomePage.tsx` | P1-A 已完，不改 |
| 新 UI / 新 API | P1-B 不做增强 |
| project.status 查询 | P1-B 不做异步调用 |

---

## 三、验收标准

- [ ] `ProposalDetailPage.tsx` 中 `/work/${proposal.projectId}` 已移除
- [ ] `PlanningProposal.tsx` 中 `/work/${p.projectId}` 已移除
- [ ] `PlanningProposal.tsx` toast 中 `/work/` 路径已移除
- [ ] 以上 2 文件外部**零变更**
- [ ] `tsc -b && vite build` 通过
- [ ] commit message: `fix(frontend): route creative handoff links to planning workspace`

---

## 四、回报格式

执行后请回报以下内容：

```
## staged diff stat
{git diff --staged --stat 输出}

## staged name-only（夹带检查）
{git diff --staged --name-only 输出}

## diff 摘要
| 修改 | 内容 |
|------|------|
| 修改 1 | ProposalDetailPage.tsx: href + 文案 |
| 修改 2 | PlanningProposal.tsx: href + 文案 |
| 修改 3 | PlanningProposal.tsx: toast 文案 |
| 验证 | 两文件中 0 处 /work/ |

## staged-only build
{tsc -b && vite build 结果}

## 是否夹带
{是/否，列出其他文件}
```
