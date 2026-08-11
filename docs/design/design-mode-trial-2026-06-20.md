# Cursor Design Mode 试验记录

> **状态**：⛔ 已冻结 · 历史视觉试验 · 最后核对 2026-08-11
> **日期**：2026-06-20  
> **执行**：用户 + Cursor（Design Mode / Browser 点选迭代）  
> **用途**：与 Codex / 司令部对齐；个人尝试记录  
> 分支 `ui/design-mode-trial` 远端已于 2026-08-11 治理删除；相关提交已可从 `master` 历史追溯。本文档为冻结历史试验，**不作为当前操作依据**。文中旧 branch/SHA 描述**当时**执行环境。

---

## 一、背景：为什么做这次试验

### 1.1 前序：Open Design 战役已冻结

2026-06-18 前后，项目曾基于 Open Design 回传的视觉 spec（`handoffs/opendesign-ui-audit-2026-06-18/`）在分支 `feature/writing-editor-ui-slice-1-4` 上推进 Slice-1～4 UI 改造。该战役因以下原因**叫停并冻结**：

- 外部视觉方案在工程行为（保存 / dirty / 路由）未冻结时被当作实现授权；
- Slice 按视觉切分，Slice-2 起触及写作编辑器保存架构债；
- Agent 局部「修到全绿」导致范围膨胀。

**冻结 SSOT**：`feature/writing-editor-ui-slice-1-4` @ `a5ff728`（仅 Slice-1/2 已提交；Slice-3+ 与 stash 内 Autosave 改造**不得**直接合并）。

### 1.2 本次动机

用户在 Cursor 中发现 **Design Mode**（Agents Window → Browser → `Ctrl+Shift+D`），希望验证：

> 是否可以在**不依赖 Open Design 外部方案**的前提下，对现有 React UI 做安全、小步、可回滚的视觉优化。

**结论（试验末）**：体验良好；**短期内不再推进 Open Design 驱动的 UI 战役**；后续 UI 抛光优先走 Design Mode + 独立 visual 分支。

---

## 二、试验设置

| 项 | 值 |
|----|-----|
| **基线分支** | `feature/workdetail-p1` @ `a7860df` |
| **试验分支** | `ui/design-mode-trial`（从上述基线新建） |
| **刻意排除** | `feature/writing-editor-ui-slice-1-4` 全部改动 |
| **运行环境** | `npm run dev` → 前端 `:3000`，后端 `:5000` |
| **登录** | 默认 `APP_PASSWORD` 未设时使用 `novel2024` |
| **工具** | Cursor Design Mode：Browser 点选元素 → Chat 发视觉指令 |

### 2.1 约束（试验全程遵守）

- **仅改 UI**：Tailwind / className / 文案 / 布局 / 颜色 / 圆角
- **禁止**：state、handler、API、路由、保存 / autosave、Monaco 配置、新 ref / 协调器
- **单步小 diff**：每次只改点选区域，用户 Browser 热更新验收

### 2.2 开发环境备忘

- 首次启动曾遇：`frontend` 缺 `node_modules`（vite 找不到）、`:5000` 端口占用。
- 处理：在 `frontend/` 执行 `npm install`；停掉旧 node 进程后单终端 `npm run dev`。
- DB：`.env` 中 `DATABASE_URL=file:./dev.db`，需存在 `backend/dev.db`（可从 `backend/prisma/dev.db` 复制）。

---

## 三、Design Mode 工作流（可复现）

1. 打开 `http://localhost:3000`，登录应用  
2. `Ctrl+Shift+P` → Agents Window  
3. Browser 打开目标页 → `Ctrl+Shift+D` 进入 Design Mode  
4. 单击 / 多选元素 → `Ctrl+L` 或 comment 送入对话  
5. 用自然语言描述视觉改动（例：「五阶段卡片加底色，不要改点击行为」）  
6. Cursor 改代码 → Vite HMR → Browser 验收  
7. 满意后继续下一处点选  

**与 Open Design 的分工差异**：

| | Open Design | Cursor Design Mode |
|--|-------------|-------------------|
| 产出 | 会诊文档、HTML 原型 | 直接改仓库 React/CSS |
| 是否动代码 | 否（handoff 边界） | 是 |
| 上下文 | 截图 + brief | 运行中 DOM、组件名、props、截图 |
| 风险 | 易被当成实现卡 | 需 prompt 守住「只改视觉」边界 |

---

## 四、产品决策（试验中确认）

| 议题 | 决策 |
|------|------|
| 顶栏五 tab 是否保留 | **保留**（深层页仍需全局部门导航；主页重复感可接受，暂不隐藏 tab） |
| 是否增加底栏 footer | **增加**；最终形态：居中一行，浅灰统一色 |
| Open Design 方案 | **试验期内不再作为 UI 实现输入** |
| 是否 commit | 2026-06-20 末：**先保存工作区，不急于提交** |

---

## 五、改动清单（已提交）

**分支**：`ui/design-mode-trial`  
**相对基线**：`a7860df`  
**提交**：`ee2d55d`（`.gitattributes` + 换行符归一化）、`9b07129`（视觉改动）  
**统计**：3 files，+147 / −26 lines（视觉 diff；含 `.gitattributes` 时共 4 files）

### 5.1 `frontend/src/pages/HomePage.tsx`

- 主标题：「我的创作台」→ **「我的小说创作工作台」**
- 副标题：「五段管线一览」→ **「五阶段创作流程一览」**
- 五阶段卡片：
  - 各阶段独立浅色底色（amber / blue / indigo / orange / emerald）
  - 选中态对应色 ring + 边框
  - 数量与后缀合并为一行（例：`9 部创意作品`）
  - 主标题增加英文进行时（Library 除外）：
    - Creating / Planning / Writing / Reviewing / Library
- 下方详情区标题同步「中文 | English」格式

### 5.2 `frontend/src/components/Layout.tsx`

- **顶栏品牌**：蓝色方块 + 羽毛 → **暗红 `bg-red-900` + W 字标**（`IconBrandLogo`）
- **五部门 tab**：与主页卡片同色体系（未选中浅底、选中实心）
- **右上角工具图标**：增加悬停中文 tooltip（数据统计 / 系统设置 / 文件暂存）
- **底栏 footer**（非写作全屏编辑器页）：
  - 居中：`[浅灰底 W] 小说创作器 © 2026 Novel Writer`
  - 图标与文字统一 `text-gray-400`，W 置于 `bg-gray-100` 小方块内

### 5.3 `frontend/src/components/ui/icons.tsx`

- 新增 **`IconBrandLogo`**：Writer 首字母 **W** 笔画标（替代顶栏 `IconFeather`）

### 5.4 明确未改动

- 写作编辑器全屏页布局与保存逻辑
- 路由、API、Auth、dashboard 数据逻辑（除纯展示文案）
- `feature/writing-editor-ui-slice-1-4` 任意 commit

---

## 六、与冻结分支 / Open Design 的关系

```
feature/workdetail-p1 @ a7860df     ← Open Design handoff 原基线
    │
    ├── feature/writing-editor-ui-slice-1-4 @ a5ff728   ← 已冻结，勿继续
    │       （Open Design 驱动的 Slice-1/2 + 未授权 stash）
    │
    └── ui/design-mode-trial @ 9b07129   ← 本次 Design Mode 成果（本地已提交，未 push）
```

- Open Design 材料仍存放于 `handoffs/opendesign-ui-audit-2026-06-18/`，可作**历史参考**，**不**作为当前 UI 实现授权。
- 若未来需要「长什么样」的外部会诊，Open Design 仍可 **inform**，但必须经「工程差距清单 → 低风险 visual-only TASK 卡」后才可落地。

---

## 七、给 Codex 的对齐要点

1. **SSOT 分支**：UI 视觉试验请基于 `ui/design-mode-trial` 或从其 commit 之后的新 visual 分支；**不要**在 `feature/writing-editor-ui-slice-1-4` 上继续。
2. **范围**：接受本次 3 文件 diff 为「Design Mode Trial v1」；合并 master 前需司令部裁决 + 可选 PR review。
3. **行为冻结**：任何涉及 `WritingEditorPage` / 保存 / 导航守卫的改动，须先出 Slice-0 行为卡，**不可**与 visual trial 混在同一 PR。
4. **stash 警示**：`git stash@{0}`（`wip writing-editor-ui-slice before switch to worktree`）含 WritingEditorPage 大规模 Autosave 改造，**待裁决**，勿自动 apply。
5. **下一步可选**：
   - commit + push `ui/design-mode-trial`；
   - 或 cherry-pick 纯 UI commits 到新 PR；
   - 继续 Design Mode 抛光其他页面（列表页、侧栏空状态等），仍遵守 visual-only 约束。

---

## 八、经验小结

### 有效做法

- 从**稳定基线**切 **visual-only** 分支，与 Open Design / Slice 战役物理隔离；
- Design Mode **点选**比文字描述「顶栏第三个按钮」准确得多；
- 每步只改一处，用户即时验收，节奏可控；
- 顶栏 tab 与主页卡片**职责不同**（导航 vs 仪表盘），可共存。

### 需避免

- 把 Design Mode 试验与行为重构绑在同一分支 / 同一 PR；
- 在 `NODE_ENV=production` 或未装 devDeps 环境下宣称「手验通过」；
- 恢复 Open Design Slice 战役式「多 slice 连带实现」。

---

## 九、当前仓库状态（文档生成时）

```text
分支：ui/design-mode-trial
HEAD：a7860df（无新 commit）
已修改未暂存：
  frontend/src/pages/HomePage.tsx
  frontend/src/components/Layout.tsx
  frontend/src/components/ui/icons.tsx
未跟踪（与本次无关）：handoffs/、reports/、nul
```

**提交建议 message（供日后使用）**：

```text
feat(frontend): Design Mode trial — homepage and shell visual polish

Homepage stage cards, bilingual titles, Layout brand/tabs/footer;
visual-only; no save/route/API changes.
```

---

## 十、相关文档索引

| 文档 | 路径 |
|------|------|
| Open Design handoff（已冻结参考） | `handoffs/opendesign-ui-audit-2026-06-18/README.md` |
| P1 入口架构（行为边界） | `docs/design/design-P1-entry-architecture.md` |
| 0608 宪法 handoff | `docs/design/0608-constitutional-guidance/handoff-to-codex-2026-06-10.md` |
| Cursor 3 Design Mode 说明 | https://cursor.com/blog/design-mode |

---

*文档版本：v1.0 | 2026-06-20 | 作者：用户试验 + Cursor 整理*
