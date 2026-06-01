# 提交整理回报 — TASK-011 ~ TASK-016（v2-dev）

**整理时间**：2026-06-01  
**分支**：`v2-dev`（相对 `origin/v2-dev` 新增 4 个 commit，此前已 ahead 12）  
**工作区**：已干净（无未提交改动）  
**未执行**：`git push`（按需由维护者推送）

---

## 提交列表（自旧到新）

| SHA | 说明 |
|-----|------|
| `74a527e` | **feat(backend): 2.0 状态体系、作品 API 与 /work 聚合 (TASK-011/012/016)** |
| `9457e1f` | **feat(frontend): 五段导航、/work 中枢与企划入口 (TASK-011/012)** |
| `c74b301` | **feat(frontend): 创作室纯 Markdown 编辑器与定制图标 (TASK-013)** |
| `3e49854` | **feat(frontend): 主页仪表盘、设置统计与作品暂存 (TASK-014~016)** |

### 1. 后端（011 + 012 + 016 API）

- `status-migration.ts`：Legacy → 7 态映射
- `projects.ts`：7 态枚举、导入去 Collection、`GET ?status=`、`POST shelve/restore`
- `work.ts`：`GET /api/v2/work/:projectId` 聚合作品设定
- `proposals.ts`、`schema.prisma` 注释同步

### 2. 前端地基与中枢（011 + 012）

- 路由：`/work/:id`、`/shelf`、创作室路径
- `WorkDetailPage` + `workApi`
- 看板/徽章/企划跳转；Collection 去 Legacy
- 文档：`TASK-011.md`、`TASK-012.md`、`CURSOR_REFERENCE.md` 更新

### 3. 创作室与图标（013）

- `WritingEditorPage`、`ReferenceSidebar`、Monaco/Markdown 调整
- `icons.tsx` 全站替换 lucide
- 文档：`TASK-013.md`、`icon-swap-guide.md`

### 4. 主页 / 设置 / 暂存（014 ~ 016）

- `HomePage` 五阶段仪表盘
- `settingsStore`、`SettingsPage`、`StatsPage`
- `ShelfPage`、`Layout` 侧栏与 AI Tab 联动
- 文档：`TASK-014~016.md`、`EXECUTION-REPORT-TASK-014-016.md`、`NEXT-PHASE-2026-06-01.md`

---

## 任务验收快照（供 Claude 评估）

| 任务 | 状态 | 备注 |
|------|------|------|
| 011 地基 | ✅ 已提交 | 7 态、五段导航、路由、Collection 清理 |
| 012 中枢 | ✅ 已提交 | `/work` 聚合页、企划入口 |
| 013 编辑器 | ✅ 已提交 | 纯 MD、四模式右栏 |
| 014 主页 | ✅ 已提交 | 阶段卡片 + 继续创作 |
| 015 设置/统计 | ✅ 已提交 | persist 设置、客户端统计 |
| 016 暂存 | ⚠️ 部分 | API + ShelfPage 已提交；**全站仍无「移入暂存」按钮** |

---

## 已知缺口（TASK-017 前待办）

1. **管线闭环（TASK-017）**：`WorkDetailPage` / `ProjectCard` 阶段推进、相邻回退、过渡弹窗、移入暂存按钮。
2. **编审部**：按 `NEXT-PHASE` 搁置；`reviewing` 仅作 status。
3. **部署**：Caddy `novel.pf2008.com` 配置在服务器 `/etc/caddy`，**未纳入本仓库提交**。

---

## 构建验证建议

整理后可在本地复验：

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit && npm run build
```

---

## 给 Claude 的一句话

**011~016 已在 `v2-dev` 拆成 4 个语义 commit（1 后端 + 3 前端），工作区干净，可据此下发 TASK-017（管线闭环 + 移入暂存 UI）。**
