# Day 1 代码冲突分析（v4.1）

> **版本**：v4.1（2026-06-04）  
> **对照**：VPS `v2-dev` + `day1-vps-code-index.md`  
> **迁移**：`v2-migration-map.md`（第 0 步）  
> **设计**：`overall-architecture.md` §十一

---

## 冲突点表（C-01 ~ C-18）

| 编号 | 位置 | 类型 | 解决方案 |
|------|------|------|---------|
| C-01 | `schema.prisma` Project | 缺 7 时间戳 + `writingStyle` + `deletedAt` + `proposalId` | 加字段 + index |
| C-02 | `schema.prisma` Proposal | 文档曾写「新建」 | **扩展**已有模型（innovation/metadata/references） |
| C-03 | Project.status | 7 值 | 扩 11 值 + TASK-203 迁移 |
| C-04 | `routes/projects.ts` ~816 行 | 缺语义端点 + 旧 `transition` | 新建/拆分 `transitions`；13 端点 |
| C-05 | `import` | `imported` | **保留**（D3 决议写入迁移表） |
| C-06 | `move-to-draft` | 废弃 | → `move-to-planning` |
| C-07 | `metadata.writingStyle` | JSON 内 | TASK-203 上提 `Project.writingStyle` |
| C-08 | `api.ts` | TS 7 值 | 11 值唯一源 |
| C-09 | `WorkDetailPage.tsx` | 状态字典不全 | `utils/statusDict.ts`（非 ProjectDetailPage） |
| C-10 | `WritingEditorPage.tsx` | 四模式 + 作品级 UI | pure：保留 reference 侧栏，去 ai/review/状态下拉 |
| C-11 | `Layout.tsx` | 缺墓园；企划 Tab 名 | 立项总账 + 🗑️ L1 |
| C-12 | `App.tsx` | 无 `?from=` | searchParams |
| C-13 | `AuthGuard.tsx` | 绿条 | **非 M1 阻塞**（已路由内复检） |
| C-14 | `projects.ts` 体积 | transition/shelve 耦合 | 与 C-04 同卡重构 |
| C-15 | 创意组 TASK-101/102 | Proposal 双轨 | `v2-migration-map.md` §3 |
| C-16 | `HomePage`/`dashboard.ts` | 旧 status 聚合 | M2 TASK-217 |
| C-17 | `proposals.ts` approve | 创建 `Project(draft)` | → `planning` + 时间戳 |
| C-18 | Chapter status | 三套枚举 | 锁 `draft/writing/completed` |

---

## 10 步落地顺序（v4.1）

| 步 | 内容 | 里程碑 |
|----|------|--------|
| **0** | `v2-migration-map.md` 评审 + Proposal/Project 映射确认 | 发卡前 |
| 1 | C-01~03 schema + Proposal 扩展 | M1 |
| 2 | C-07 + TASK-203 数据迁移 | M1 |
| 3 | C-04~06 + C-17 端点（禁跨阶段） | M1 |
| 4 | C-08~09 + C-11 导航/字典 | M1 |
| 5 | C-06 企划课 Tab ②③④ + C-05 imported | M1 |
| 6 | C-09 + 墓园 C-11（TASK-209） | M1 |
| 7 | C-10 + C-12 + C-13? | M2 |
| 8 | C-16 + C-18 收尾 | M2/M3 |
| 9 | C-19 `/shelf`→`/graveyard` | M3 |
| 10 | 废弃旧 transition / StageTransitionModal 跨阶段 | M3 |

**原则**：M1 验收不通过不开 M2。

---

## TASK ↔ 冲突（M1/M2/M3）

| 里程碑 | TASK | 主要冲突 |
|--------|------|----------|
| **M1** | 200~209 | C-01~07, C-04~06, C-11, C-14~17, 墓园 |
| **M2** | 210~217 | C-09~10, C-12, C-16, C-18 |
| **M3** | 218~221 | C-19, 废弃旧 API, import 流程 |

---

## 实现文件名对照（v4.1 锁定）

| 设计稿旧名 | VPS 实际 |
|------------|----------|
| `ProjectDetailPage` | `WorkDetailPage.tsx` |
| `EnhancedEditorPage` | `WritingEditorPage.tsx` |
