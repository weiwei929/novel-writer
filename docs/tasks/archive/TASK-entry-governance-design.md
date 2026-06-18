# TASK: 入口交互治理方案 — 五部门三状态交互设计

> **模式**：只读设计分析，不修改代码
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **依据**：0608 宪法设计体系 + 司令部 9 条入口治理原则
> **前置审计**：`TASK-entry-semantic-audit.md`（25 处 `/work/:id` 入口 + 8 🟠 + 1 🔴）

---

## 背景

第一轮入口语义审计（TASK-entry-semantic-audit）识别出 25 处 `/work/:id` 导航入口，其中：
- 1 🔴（ProposalDetailPage 裸链）
- 8 🟠（固定 `from=` 与作品实际状态不匹配 / 缺少 `from=`）
- 16 ✅（合规）

司令部裁定：**不围绕单个裸链/固定 from 修修补补**，将问题上升为全项目入口交互治理设计议题。

---

## 司令部 9 条入口治理原则

### P1 — 五部门三工作区
每个入口必须明确所属部门上下文，跳转后 WorkDetailPage 能据此选择正确的 badge/动作。

### P2 — 入口文案必须反映部门视角
"查看作品"是 1.0 全局思维。2.0+ 各部门应从自身视角命名入口：
- 创意组：查看提案 / 查看企划进度
- 企划课：进入企划 / 查看立项作品
- 创作室：进入创作 / 查看作品
- 编审部：进入审阅 / 查看审阅报告
- 文集库：查看归档作品 / 查看书评

### P3 — 入口导航必须携带部门上下文
每个 `/work/:id` 导航必须携带 `?from=` 参数，或使用部门独立路由（如 `/editorial/:id`、`/library/:id`）。

例外：**仅允许一个 bypass** — 企划课接收后"直接进入创作"的快捷入口（需特别标记）。

### P4 — 同一入口不得服务多部门
共享组件（如 ProjectCard）不能裸用 `/work/${id}`。调用方必须注入 `from` 上下文，或组件内部根据 prop 动态选择。

### P5 — 入口可见性必须受部门状态过滤
- 创意提案列表只显示 proposals（非 projects）
- 企划课列表只显示 `planning|planned`
- 创作室列表只显示 `writing|written`
- 编审部列表只显示 `reviewing|reviewed`
- 文集库只显示 `archived`
- 文件暂存池混部门但不混入口（显示暂存标记 + 来源部门）

### P6 — "提交"动作后入口应从来源列表消失
当作品通过提交动作进入下一部门后，来源部门列表中不应再出现该作品。

### P7 — 每列（三工作区）入口语义对齐
每个部门的 3 列（待处理/进行中/已完成）应有统一的入口语义模式：
- 待处理列：进入 XX（开始动作）
- 进行中列：继续 XX（继续动作）
- 已完成列：查看 XX（只读查看）

### P8 — 放行协议入口独立
各部门的"放行到下一部门"入口不应是 `/work/:id`，而应是**部门内操作**（按钮/动作），不应与"查看"入口混淆。

### P9 — 兜底策略
当 `from=` 缺失、项目 status 无法映射到唯一部门时，WorkDetailPage 应有合理的兜底行为（如显示通用视图），而不是默认 `badgePhase='studio'`。

---

## 审计数据（第一轮发现）

### 🔴 高危（1 处）

| 文件 | 行号 | 当前入口 | 问题 |
|------|------|---------|------|
| `ProposalDetailPage.tsx` | L143 | `` `/work/${proposal.projectId}` `` 裸链无 `from=` | 创意组页面跳转到无部门上下文的 WorkDetailPage |

### 🟠 中危（8 处）

| # | 文件 | 行号 | 当前入口 | 问题 |
|---|------|------|---------|------|
| 1 | `WritingEditorPage.tsx` | L250 | `` `/work/${projectId}` `` 无 `from=` | 错误回退路径不一致 |
| 2 | `WritingEditorPage.tsx` | L294 | `` `/work/${projectId}` `` 无 `from=` | 同上 |
| 3 | `WritingEditorPage.tsx` | L319 | `` `/work/${projectId}` `` 无 `from=` | 同上 |
| 4 | `ShelfPage.tsx` | L67 | `` `/work/${project.id}` `` 无 `from=` | 文件暂存池混合部门 |
| 5 | `dashboard.ts` | L60 | `href: \`/work/${p.id}\`` 无 `from=` | 首页面板裸链 |
| 6 | `dashboard.ts` | L78-89 | 固定 `from='planning'` | 编审部/文集库作品用了企划课上下文 |
| 7 | `ProjectCard.tsx` | L71 | `` `/work/${project.id}` `` 无 `from=` | 共享组件多部门复用 |
| 8 | `ProposalDetailPage.tsx` | L143 | 同上 🔴/🟠 合并 | 创意组页面入口 |

### ✅ 合规（16 处）
各部门专用页面（PlanningInProgressPage、PlanningProjectsPage、WritingProjectsPage、EditorialPage、LibraryPage 等）使用独立路由或正确的 `?from=`，详见第一轮审计报告。

---

## 产出要求

请产生两个交付物：

### A. 完整入口审计表（覆盖全部 25+ 入口）

按以下格式逐条记录每个入口：

```
| 文件:行号 | 入口文案 | 来源部门 | 当前目标 | 当前状态 | P1-P9 评估 | 建议动作 |
```

其中"建议动作"列取值：保留 / 改名 / 加 from / 改路由 / 删除 / 需讨论

### B. 入口交互治理方案

回答以下 10 个问题：

1. **入口分类体系**：所有入口应分为哪几类？（按部门/按路由模式/按交互模式）

2. **部门独立路由 vs `?from=` 参数**：哪些入口应该拥有独立路由（如 `/editorial/:id`）？哪些应该继续用 `/work/:id?from=X`？判断标准是什么？

3. **共享组件入口治理**：ProjectCard 的入口应该如何治理？调用方注入 vs 组件根据 prop 判断 vs 其他方案？

4. **入口文案映射表**：为每个部门×每列状态，定义标准入口文案（如 企划课·待处理列 → "评估并立项"、企划课·进行中列 → "进入企划"、企划课·已完成列 → "查看企划成果"）。

5. **badgePhase 兜底策略**：当 `from=` 缺失时，`getWorkContextFromStatus(status)` 方案是否可行？请评估以下方案：
   - A: `status→phase` 映射（planning/planned→planning, writing/written→studio, etc.）
   - B: 显示通用视图（无 badge，精简动作）
   - C: 从 HTTP Referrer 推断
   - D: 其他方案

6. **ProposalDetailPage 🔴 裸链方案**：该入口在创意组页面跳转到 `/work/${id}`，建议的修复方式是什么？

7. **WritingEditorPage 🟠 回退路径治理**：3 处回退路径不一致（L250/L294/L319 无 from=，L251 有 from=writing），建议如何统一？

8. **dashboard.ts 🟠 跨部门上下文错乱**：L78-89 用固定 `from='planning'` 覆盖编审部和文集库作品，建议如何修复？

9. **ShelfPage 🟠 混合部门入口**：文件暂存池中的作品可能来自任何部门，入口应如何处理？

10. **分阶段执行计划**：将建议的修改分阶段排列（P0/P1/P2/📋），预估每个阶段的 diff 规模和风险。

---

## 司令部补充要求 — 部门子页 + 主页 UI 统一设计

本次方案须一并纳入部门子页统一布局和主页 UI 重设计的整体方向评估。

### 一、部门子页统一布局

每个五部门子页的主区域，统一采用以下结构：

```
┌─────────────┬─────────────┬─────────────┐
│  待处理      │  进行中      │  已完成      │
│             │             │  待提交      │
│  (左列)      │  (中列)      │  (右列)      │
├─────────────┴─────────────┴─────────────┤
│  文件暂存池                                │
│  (本部门退出主流程的作品/文件)               │
└───────────────────────────────────────────┘
```

规则：
- **三列工作区**：左列 = 待处理、中列 = 进行中、右列 = 已完成 / 待提交
- **下方暂存池**：展示本部门暂存或退出主流程的作品/文件
- **暂存不是删除，不是 archive**：暂存项从主流程三列中移除，但保留在暂存池中
- **暂存池由更高层裁决**：后续可恢复或最终处理
- **暂存项不再出现在三列**：一旦进入暂存池，即从对应列消失

### 二、主页 UI 方向

项目主页或部门首页应服从统一结构，不再使用旧的 1.0 泛化卡片入口：

- **五部门入口**：清晰展示 5 个部门
- **数量表达**：每个部门当前待处理 / 进行中 / 已完成数量
- **暂存提醒**：暂存池数量或提醒
- **禁止 bypass**：不直接提供绕过部门的"查看作品"入口
- **主页聚焦导航**：主页 = 部门导航 + 全局状态摘要，不是作品列表

### 三、额外评估问题（接原 10 问）

在上述框架下，额外评估以下问题：

11. **当前主页 UI 问题**：当前首页/主页是否仍有旧 1.0 入口问题？具体列出。

12. **各部门子页三列现状**：逐个部门评估其子页是否已符合三列工作区布局？哪些已有雏形？哪些仍是旧列表？

    | 部门 | 当前子页 | 三列状态 | 说明 |
    |------|---------|---------|------|

13. **已具备三列雏形的子页**：哪些子页已经有三列布局（如创意组、企划课、编审部等）？具体到文件路径和实现方式。

14. **暂存池位置决策**：暂存池应放在每个部门子页下方（部门局部），还是作为全局管理入口 + 部门局部摘要？评估两种模式的优缺点：
    - 方案 A：全局暂存池（如当前 ShelfPage）+ 各部门无局部暂存池
    - 方案 B：各部门局部暂存池（子页下方）+ 全局汇总入口
    - 方案 C：混合（各部门局部摘要 + 全局管理页面）

15. **第一阶段范围**：第一阶段是否只做 UI 信息架构设计（重新组织现有组件的位置和入口文案），不立即实现暂存池后端？评估：
    - 什么是第一阶段可做的
    - 什么需要后端支持
    - 两者的依赖关系

16. **暂存池与现存机制的关系**：当前已有 `deletedAt` 元标记、`ShelfPage` 页面、以及 `shelved` legacy 状态。新暂存池概念与这三者的关系是什么？如何区分？
    - `deletedAt`：软删标记，恢复后保持原状态
    - `ShelfPage`：现有文件暂存页面
    - `shelved`：1.0 遗留状态字面量
    - 新暂存池：???

---

## 约束

- ❌ 不修改任何代码
- ❌ 不 stage / commit / push
- ✅ 只读分析（grep / read / git log）
- ✅ 可在方案中引用现有设计文档（docs/design/0608-constitutional-guidance/）
- ✅ 对棘手问题标注"需司令部会诊"

---

## 参考文档

- `docs/design/0608-constitutional-guidance/0608-dept-workspace-model.md` — 五部门三工作区核心模型
- `docs/design/0608-constitutional-guidance/0608-status-context-labeling.md` — 部门上下文标签系统
- `docs/design/0608-constitutional-guidance/0608-overall-architecture.md` — 系统架构总纲
- `docs/design/0608-constitutional-guidance/0608-file-staging-pool.md` — 文件暂存池重定义
- `frontend/src/pages/WorkDetailPage.tsx` — 五部门上下文中枢（badgePhase 回落逻辑 L128-140）
- `frontend/src/components/projects/ProjectCard.tsx` — 共享组件裸链 L71
- `frontend/src/pages/creative/ProposalDetailPage.tsx` — 🔴 入口 L143
- `frontend/src/pages/WritingEditorPage.tsx` — 🟠 回退路径 L250/294/319
- `frontend/src/pages/ShelfPage.tsx` — 🟠 混合部门 L67
- `frontend/src/services/dashboard.ts` — 🟠 跨部门上下文 L60/78-89
- `frontend/src/pages/HomePage.tsx`（或当前首页） — 主页 UI 审查
- `frontend/src/pages/creative/CreativePage.tsx` — 创意组 4 Tab 布局
- `frontend/src/pages/planning/PlanningPage.tsx` — 企划课三工作区
- `frontend/src/pages/writing/WritingPage.tsx` — 创作室三工作区
- `frontend/src/pages/EditorialPage.tsx` — 编审部三工作区
- `frontend/src/pages/LibraryPage.tsx` — 文集库三工作区

---

## 回报格式

```
=== 入口交互治理方案 - 回报 ===

## A. 入口审计表
[完整审计表]

## B. 治理方案 - 16 问题回答
1. 入口分类体系: ...
2. 独立路由 vs from=: ...
3. 共享组件入口治理: ...
4. 入口文案映射表: ...
5. badgePhase 兜底策略: ...
6. ProposalDetailPage 🔴 方案: ...
7. WritingEditorPage 🟠 方案: ...
8. dashboard.ts 🟠 方案: ...
9. ShelfPage 🟠 方案: ...
10. 分阶段执行计划: ...
11. 当前主页 UI 问题: ...
12. 各部门子页三列现状: ...
13. 已具备三列雏形的子页: ...
14. 暂存池位置决策（A/B/C）: ...
15. 第一阶段范围: ...
16. 暂存池与现存机制关系: ...

## 需司令部会诊项
- 项1: ...
- 项2: ...

## 预期工作量
P0: N 文件 / ~N 行
P1: N 文件 / ~N 行
P2: N 文件 / ~N 行
📋: N 项
```
