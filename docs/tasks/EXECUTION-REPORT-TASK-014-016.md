# 执行回报：TASK-014 / TASK-015 / TASK-016

> **汇报时间**：2026-06-01  
> **分支**：`v2-dev`（本地未统一 commit，与 TASK-011~013 改动同仓）  
> **验证环境**：VPS `/root/novel-writer`，Caddy 反代 `https://novel.pf2008.com`

---

## 一、运行状态（已拉起）

| 服务 | 地址 | 状态 |
|------|------|------|
| 后端 Fastify | `http://127.0.0.1:5000` | ✅ 运行中（nodemon） |
| 前端 Vite dev | `http://127.0.0.1:3000` | ✅ 运行中 |
| Caddy 生产静态 | `https://novel.pf2008.com` | ✅ 已 build 最新 `frontend/dist` |
| 健康检查 | `GET /health` | ✅ `{"status":"ok","database":"connected"}` |

**浏览器建议访问（任选其一）：**

| 场景 | URL |
|------|-----|
| **生产域名（推荐看 TASK-014~016 静态包）** | https://novel.pf2008.com/ |
| 主页仪表盘 | https://novel.pf2008.com/ |
| 数据统计 | https://novel.pf2008.com/stats |
| 系统设置 | https://novel.pf2008.com/settings |
| 作品暂存 | https://novel.pf2008.com/shelf |
| 本地热更新开发 | http://10.0.0.230:3000/ 或 `localhost:3000` |

> Caddy 配置：`/` → `frontend/dist`，`/api/*` → `:5000`。改代码后需 `cd frontend && npm run build` 才能在域名上看到最新 UI。

---

## 二、构建验证

```bash
cd backend  && npx tsc --noEmit   # ✅ 通过
cd frontend && npx tsc --noEmit   # ✅ 通过
cd frontend && npm run build    # ✅ 通过
```

---

## 三、TASK-014 主页仪表盘

### 任务目标

将 `HomePage` 从 1.0 欢迎页改为管道仪表盘：五阶段卡片、继续创作、最近作品、骨架屏。

### 实现文件

| 文件 | 改动 |
|------|------|
| `frontend/src/pages/HomePage.tsx` | **重写** |

### 验收对照

| # | 标准 | 结果 | 说明 |
|---|------|------|------|
| 1 | 五阶段卡片 + 各阶段作品数 | ✅ | `STAGES` + `countByStage()`，`draft/planning/writing/reviewing/completed+archived` 映射 |
| 2 | `writing` 有内容章节时显示「继续创作」 | ✅ | 遍历最近 `writing` 作品，查章节，找有 `content` 的章 |
| 3 | 无创作中时「开始新作品」→ `/creative/references` | ✅ | 虚线空态 + 链接 |
| 4 | 最近作品最多 5 条，点击 `/work/:id` | ✅ | `recentProjects` + `ProjectStatusBadge` |
| 5 | 阶段卡片 hover + 跳转 L1 | ✅ | `hover:-translate-y-0.5`，链到各阶段入口 |
| 6 | `shelved` 不计入阶段计数 | ✅ | `countByStage` 中 `continue` 跳过 |
| 7 | 加载骨架屏 | ✅ | `Skeleton` 组件，非 LoadingOverlay |
| 8 | tsc + build | ✅ | 已验证 |

### 备注

- 未新增 `getChaptersByProjectBatch`；继续创作对最多 5 个 `writing` 作品串行 `chaptersApi.getByProjectId`，数据量小时可接受。

---

## 四、TASK-015 系统设置 + 数据统计

### 任务目标

填充 `/settings`、`/stats`；Zustand 持久化 AI 开关与编辑器偏好；服务状态检测。

### 实现文件

| 文件 | 改动 |
|------|------|
| `frontend/src/stores/settingsStore.ts` | **新建** |
| `frontend/src/pages/SettingsPage.tsx` | **重写**（替换原 AI 密钥配置页） |
| `frontend/src/pages/StatsPage.tsx` | **重写**（客户端聚合，非仅 `statsApi`） |
| `frontend/src/components/Layout.tsx` | AI 合伙人关 → 隐藏创意组 AI 搜索/讨论 Tab |
| `frontend/src/pages/WritingEditorPage.tsx` | 读 store：AI 模式、自动保存、参考侧栏默认 |
| `frontend/src/components/editor/MarkdownEditor.tsx` | 主题/字号/自动保存来自 store |
| `frontend/src/components/editor/EnhancedMonacoEditor.tsx` | `fontSize` prop |
| `frontend/src/pages/ReviewPage.tsx` | 编审 AI 卡片受 `ai.auditor` 控制 |
| `frontend/src/pages/planning/ProposalEvalPage.tsx` | 企划审校占位区受 `ai.reviewer` 控制 |

### 验收对照

| # | 标准 | 结果 | 说明 |
|---|------|------|------|
| 1 | `/settings` 三区：AI 开关×4、编辑器偏好×5、服务状态 | ✅ | |
| 2 | AI 开关刷新后保留 | ✅ | `persist` key `novel-settings` |
| 3 | 编辑器偏好保存后编辑器生效 | ✅ | 主题/字号/autoSave/参考侧栏默认 |
| 4 | API + AI 连接状态 + 测试连接 | ✅ | `fetch('/health')` + `aiApi.checkStatus()` + `testConnection` |
| 5 | `/stats` 四卡 + 状态分布 + 近期活跃 | ✅ | `projectsApi.getAll` + `collectionsApi.getAll` |
| 6 | 字数 ≥1w 显示 `X.Xw` | ✅ | `formatWordCount()` |
| 7 | tsc + build | ✅ | |

### 差异 / 待评估项

| 项 | 说明 |
|----|------|
| **原 Settings 页 AI 密钥配置已移除** | 任务卡要求三区结构，未要求保留 Gemini/API Key 表单。若需服务端配密钥，应另开任务或加折叠「高级」区。 |
| **statsApi** | 任务卡写「可能无需改 api」；实现改为前端实时聚合，与旧 `statsApi.get()` 并存无冲突。 |

---

## 五、TASK-016 作品暂存

### 任务目标

`shelved` 闭环：移入（写 `_shelved`）、还原、彻底删除、列表页；「暂存阁」→「作品暂存」。

### 实现文件

| 文件 | 改动 |
|------|------|
| `backend/src/routes/projects.ts` | `GET ?status=`、`POST /:id/shelve`、`POST /:id/restore` |
| `frontend/src/services/api.ts` | label 改名 + `shelve`/`restore`/`getShelved` |
| `frontend/src/pages/ShelfPage.tsx` | **重写** |
| `frontend/src/components/Layout.tsx` | title `作品暂存` |
| `frontend/src/pages/WorkDetailPage.tsx` | `handleRestore` → `projectsApi.restore()` |

### 验收对照

| # | 标准 | 结果 | 说明 |
|---|------|------|------|
| 1 | `/shelf` 列表 / 空态 | ✅ | |
| 2 | 卡片：标题、原状态、移入时间、来源 | ✅ | 读 `metadata._shelved` |
| 3 | 还原恢复 `previousStatus` | ✅ | 后端 `POST /restore` |
| 4 | 彻底删除二次确认 + 真删 | ✅ | `window.confirm` + `DELETE` |
| 5 | `/work/:id` shelved 时 [还原][彻底删除] | ✅ | |
| 6 | 全局「暂存阁」→「作品暂存」 | ✅ | frontend 内 grep 无「暂存阁」 |
| 7 | tsc + build | ✅ | |
| 8 | 后端 shelve 路由 | ✅ | 无 token 时 `POST .../shelve` 返回 **401**（非 404），说明路由已注册 |

### 缺口（供 Claude / 产品评估）

| 优先级 | 缺口 | 说明 |
|--------|------|------|
| **P1** | **「移入暂存」入口 UI 未接** | `projectsApi.shelve()` 已实现，但全站 **无按钮** 调用（仅 Shelf 空态文案提及）。用户无法从界面把作品移入暂存，需手动 API 或 DB。建议在 `WorkDetailPage` 各状态操作栏或 `ProjectCard` 增加「移入暂存」。 |
| P2 | 存量数据无 `_shelved` | 任务卡已说明不追溯；旧 `shelved` 作品还原时 fallback `draft`。 |
| P3 | 「清空全部」 | 已实现批量 `delete`，任务卡 mock 有标题但未定义行为；属增强项。 |

---

## 六、改动文件汇总（014~016 增量）

```
frontend/src/pages/HomePage.tsx          # TASK-014
frontend/src/stores/settingsStore.ts     # TASK-015
frontend/src/pages/SettingsPage.tsx      # TASK-015
frontend/src/pages/StatsPage.tsx         # TASK-015
frontend/src/components/Layout.tsx       # 015 + 016
frontend/src/pages/WritingEditorPage.tsx # TASK-015 联动
frontend/src/components/editor/MarkdownEditor.tsx
frontend/src/components/editor/EnhancedMonacoEditor.tsx
frontend/src/pages/ReviewPage.tsx
frontend/src/pages/planning/ProposalEvalPage.tsx
backend/src/routes/projects.ts           # TASK-016
frontend/src/services/api.ts             # TASK-016
frontend/src/pages/ShelfPage.tsx         # TASK-016
frontend/src/pages/WorkDetailPage.tsx    # TASK-016 restore
docs/tasks/TASK-014.md
docs/tasks/TASK-015.md
docs/tasks/TASK-016.md
```

---

## 七、给 Claude 的评估要点

请重点评估：

1. **TASK-014**：阶段计数与状态映射是否与 2.0 管道一致；继续创作选取逻辑（最近 5 个 writing + 有内容章）是否合理。  
2. **TASK-015**：移除服务端 AI 密钥 UI 是否可接受；`settingsStore` 与编辑器联动是否完整。  
3. **TASK-016**：**移入暂存无 UI** 是否阻塞本卡「完整闭环」定义；`shelve`/`restore` API 与 `metadata._shelved` 结构是否满足后续扩展。  
4. **整体**：三张卡与 TASK-011~013（导航、`/work/:id`、编辑器）衔接是否一致；是否建议先补「移入暂存」再合并发布。

### 建议 smoke 路径（浏览器）

1. 打开 https://novel.pf2008.com/ → 看五阶段卡片与最近作品。  
2. `/stats` → 四统计卡与分布条。  
3. `/settings` → 切换 AI 开关 / 保存编辑器偏好 → 刷新验证持久化。  
4. `/shelf` → 空态（若无 shelved 数据）。  
5. 若有 `writing` 作品且有章节正文 → 首页「继续创作」→ 编辑器。  
6. 设置里关闭「AI 创意合伙人」→ 创意组子 Tab 应少 AI 搜索/讨论。

---

## 八、提交建议（未执行）

用户规则下未自动 commit。建议合并提交或分三条：

```bash
git add -A && git commit -m "feat: 主页仪表盘 — 五阶段卡片/继续创作/最近作品"
git add -A && git commit -m "feat: 系统设置 + 数据统计 — AI 开关/编辑器偏好/服务状态/统计面板"
git add -A && git commit -m "feat: 作品暂存 — shelved 完整闭环：移入/还原/彻底删除 + 改名"
```

或与 TASK-011~013 一并整理后单次提交，由维护者决定。
