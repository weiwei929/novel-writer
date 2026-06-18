# TASK: P0-B — 内部回退裸链补部门上下文（范围评估）

> **模式**：范围评估（只读）→ 司令部确认后执行
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **类型**：P0（止血）
> **依赖**：P0-A 完成后（WorkDetailPage 需能识别 `from=writing`/`from=planning`）
> **范围**：仅评估内部回退类裸链，不动入口架构类

---

## 第一步：范围评估（本次执行）

请找到以下代码位置，确认当前代码。**不要修改代码，只报告**。

### 评估项 1 — WritingEditorPage.tsx 三处回退

| 行号 | 当前代码 | 确认 |
|------|---------|------|
| L250 | `handleGoBack` → `navigate(\`/work/${projectId}\`)` | 有 ?from= 吗？ |
| L294 | 错误态回退按钮 | 同上 |
| L319 | 无章节回退按钮 | 同上 |

确认 L238 的 `navigate(\`/writing/${projectId}/${selectedChapter.id}\`)` 是编辑器内部导航，无需改。

### 评估项 2 — CreateProjectModal.tsx

| 行号 | 当前代码 | 确认 |
|------|---------|------|
| L68 | `navigate(\`/work/${newProject.id}\`)` | 有 ?from= 吗？ |

### 评估项 3 — App.tsx redirect 验证

| 行号 | 当前代码 | P0-A 后预期 |
|------|---------|------------|
| L41 | `/work/${id}?from=planning` | ✅ 已有 from=planning |
| L50 | `/work/${projectId}?from=writing` | P0-A 后 WDP 识别 from=writing |
| L57 | `/work/${projectId}?from=writing` | 同上 |

**不修改 App.tsx**，只需验证 P0-A 完成后这些 redirect 有效。

---

## 修改方案（参考，待评估后确认）

### 文件 1：`WritingEditorPage.tsx`

| 行号 | 当前 | 改为 |
|------|------|------|
| L250 | `navigate(\`/work/${projectId}\`)` | `navigate(\`/work/${projectId}?from=writing\`)` |
| L294 | `onClick={() => navigate(\`/work/${projectId}\`)}` | `onClick={() => navigate(\`/work/${projectId}?from=writing\`)}` |
| L319 | `onClick={() => navigate(\`/work/${projectId}\`)}` | `onClick={() => navigate(\`/work/${projectId}?from=writing\`)}` |

### 文件 2：`CreateProjectModal.tsx`

| 行号 | 当前 | 改为 |
|------|------|------|
| L68 | `navigate(\`/work/${newProject.id}\`)` | `navigate(\`/work/${newProject.id}?from=planning\`)` |

### App.tsx — 不修改

L41/L50/L57 已有 from=，P0-A 后自然有效。只验证。

---

## 不在此阶段修改的裸链（入口架构类 → P1）

| 文件 | 行号 | 原因 |
|------|------|------|
| `ProposalDetailPage.tsx` | 143 | 创意组历史提案是否应进入 WorkDetailPage？P1 设计 |
| `PlanningProposal.tsx` | 150 | 同上 |
| `dashboard.ts` | 60/112/128/135 | dashboard 定位 → 部门入口还是详情入口？P1 设计 |
| `ShelfPage.tsx` | 67 | 暂存池入口策略 → P1 设计 |
| `ProjectCard.tsx` | 71/140/142 | 共享组件治理 → P1 设计 |

---

## 验证标准

| # | 检查项 | 预期 |
|---|--------|------|
| 1 | WritingEditorPage 三处回退 | 全部携带 `?from=writing` |
| 2 | CreateProjectModal 创建后跳转 | 携带 `?from=planning` |
| 3 | App.tsx redirects | 未修改，已验证 |
| 4 | P1 范围 5 文件 | 未修改 |
| 5 | build | ✅ 通过 |

---

## 约束

- ✅ 仅改 WritingEditorPage.tsx 和 CreateProjectModal.tsx
- ❌ 不改 P1 范围文件
- ❌ 不改 backend / Schema
- ❌ 本次仅评估，不 commit

---

## 产出回报格式（第一步 → 评估）

```
=== P0-B 范围评估 ===

## WritingEditorPage.tsx
L250: 当前代码 → 建议改为
L294: 当前代码 → 建议改为
L319: 当前代码 → 建议改为
diff: ~N 行

## CreateProjectModal.tsx
L68: 当前代码 → 建议改为
diff: ~N 行

## App.tsx redirects（不修改）
L41: from=planning ✓
L50: from=writing ✓（P0-A 后有效）
L57: from=writing ✓（P0-A 后有效）

## 未修改文件确认
ProposalDetailPage.tsx / PlanningProposal.tsx / dashboard.ts / ShelfPage.tsx / ProjectCard.tsx
以上 5 文件确认无改动

## 总 diff
2 文件 / ~4 行 / 风险 低
```
