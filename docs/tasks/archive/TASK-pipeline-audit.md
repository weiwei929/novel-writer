# TASK-PIPELINE-AUDIT：五部门全管线只读审计

> **目的**：对 novel-writer 项目做全管线静态审计，确认当前 VPS HEAD 各阶段实现状态。
> **方式**：**只读审计** — 仅读取、grep、git diff/log/status、npm run build。**不允许**修改文件、stage、commit、或自动修复任何代码。
> **输出**：一份审计报告，所有发现按 **4 类结果** 归类。

---

## ⚠️ 执行约束（必须遵守）

```
❌ 不允许修改任何文件
❌ 不允许 git add / git stage / git commit
❌ 不允许 npm run fix 或任何自动修复
❌ 不允许创建新文件
✅ 仅可 cat / grep / git diff / git log / git status / npm run build（staged-only 只读检查）
```

审计中发现任何问题**只记录，不改动**。

---

## 审计范围

### 基线确认

```bash
# 确认当前 VPS HEAD commit
git log --oneline -1
git branch -v

# 确认 working tree 状态
git status --short
```

### 0. 后端状态机

| 检查项 | 方法 |
|--------|------|
| 状态流 | grep `PROJECT_STATUSES` + 读 `routes/projects.ts` 端点列表 |
| 语义端点 | 确认 `confirm-greenlight`, `start-writing`, `mark-written`, `submit-review`, `mark-reviewed`, `archive` 是否存在 |
| stage-guard | 读 `assertAllowedTransition`，确认跨桶硬拒、语义端点绕开 |
| IN_BUCKET_TRANSITIONS | 每个 status 的桶内白名单是否正确 |

### 1. 创意组

| 检查项 | 方法 |
|--------|------|
| 4 Tab 布局 | 读 `frontend/src/App.tsx` 创意组路由 |
| F-001 冻结 | 企划课 UI 无退回创意组按钮 |
| F-002 冻结 | 提案页面无 reject 按钮/路径 |
| F-004 冻结 | 创意组不使用 StageTransitionModal |

### 2. 企划课（已确认：f768af6）

| 检查项 | 方法 |
|--------|------|
| Tab ②③④ 三工作区 | 读 `PlanningInProgressPage` / `PlanningProjectsPage` |
| `?from=planning` | 读 `WorkDetailPage` `isPlanningContext` + `handleBack` |
| `case 'planning'` | "确认企划完成" → `confirmGreenlight` |
| `case 'planned'` + planning | "管理章节规划" |
| StageTransitionModal | planning 上下文隐藏 |

### 3. 创作室（已确认：c1ee91a）

| 检查项 | 方法 |
|--------|------|
| 三工作区列表 | 读 `WritingProjectsPage`：待创作/创作中/已完成 |
| `?from=writing` | 读 `WorkDetailPage` `isWritingContext` + `handleBack→/writing/projects` |
| `case 'planned'` + writing | "开始创作" → `startWriting` |
| `case 'writing'` + writing | "进入创作室" + "管理章节规划" |
| WritingEditorPage | 返回导航带 `?from=writing`，无审阅模式按钮 |

### 4. 编审部（P3 — 未确认）

| 检查项 | 方法 |
|--------|------|
| 三工作区列表 | 读 `EditorialPage`：待审阅/审阅中/已审阅 |
| `?from=editorial` | 读 `WorkDetailPage` `isEditorialContext` + `handleBack→/editorial` |
| `case 'written'` + editorial | "开始审阅" → `submitReview` |
| `case 'reviewing'` + editorial | "确认审阅完成" + "进入审阅" |
| ReviewDetailPage | `phase="editorial"`，真实 API 调用 |

### 5. 文集库（P4 — 未确认）

| 检查项 | 方法 |
|--------|------|
| 三工作区列表 | 读 `LibraryPage`：待归库/文集管理/已归档 |
| `?from=library` | 读 `WorkDetailPage` `isLibraryContext` + `handleBack→/library` |
| `case 'reviewed'` + library | "归入文集" + "归档" |
| LibraryDetailPage | `phase="library"` |

### 6. 全局不变量

| 检查项 | 方法 |
|--------|------|
| F-004 StageTransitionModal | 仅非上下文 fallback 可见 |
| `badgePhase` | 每部门上下文标签正确 |
| statusLabels | 读 `statusLabels.ts` 四个 phase 分支 |

---

## 审计报告格式

每项检查结果按以下 **4 类** 标记：

| 标记 | 含义 |
|------|------|
| ✅ **已实现且符合 0608** | 代码与设计文档一致，正确 |
| ⚠️ **已实现但语义/上下文不符合 0608** | 功能存在但行为偏离设计（如 label 错误、路由不对、不该出现的按钮） |
| ❌ **缺失且属 P2 必须补齐** | 当前阶段（P2）已交付范围中缺少的必要功能 |
| 📋 **缺失但属 P3/P4/后续阶段** | 不是 P2 范围，记录但暂不执行 |

### 输出示例

```
## 3. 创作室 ✅
- 三工作区列表: ✅ 符合 0608
- `?from=writing` 路由: ✅ handledBack→/writing/projects
- `case 'writing'` + writing: ⚠️ 缺少"确认创作完成"按钮（G6，属 P2 范围）
- WritingEditorPage: ⚠️ 返回导航不带 `?from=writing`（偏离 0608）
- stageManageButton: ✅ writing 上下文隐藏

## 4. 编审部 📋
- EditorialPage: 📋 未实现（P3 范围，本次不执行）
```

---

## 执行命令参考

```bash
# 确认基线
git log --oneline -3
git status --short

# 后端审计
grep -n "PROJECT_STATUSES" backend/src/routes/projects.ts
grep -n "app.post.*/" backend/src/routes/projects.ts | head -30
cat backend/src/middleware/stage-guard.ts

# 前端审计
grep -n "from === " frontend/src/pages/WorkDetailPage.tsx
grep -n "is.*Context" frontend/src/pages/WorkDetailPage.tsx
cat frontend/src/services/statusLabels.ts
cat frontend/src/pages/writing/WritingProjectsPage.tsx

# 路由审计
grep -n "path.*/" frontend/src/App.tsx | head -30

# 只读 build 检查
npm run build 2>&1 | tail -20
```
