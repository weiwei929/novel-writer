# Day 1 代码冲突分析（v4.1.1）

> **版本**：v4.1.1（2026-06-04）  
> **对照**：VPS `v2-dev`（`b579fb0`+）+ `day1-vps-code-index.md`  
> **迁移**：`v2-migration-map.md` §2.2（Q1/Q2 已锁）  
> **设计**：`overall-architecture.md` v4.1.1

---

## 冲突点表（C-01 ~ C-22）

| 编号 | 位置 | 类型 | Day 1 | 解决方案 |
|------|------|------|-------|---------|
| C-01 | `schema.prisma` Project | 缺 7 时间戳 + `writingStyle` + `deletedAt` + `proposalId` | M1-A | 加字段 + index（TASK-200） |
| C-02 | `schema.prisma` Proposal | 文档曾写「新建」 | M1-A | **扩展**已有模型 |
| C-03 | Project.status | 7 值 | M1-A | 扩 11 值 + TASK-203 迁移 |
| C-04 | `routes/projects.ts` ~816 行 | 缺语义端点 + 旧 `transition` | M1-A/B | 拆分 transitions；13 端点 |
| C-05 | `import` | `imported` | M1-B | **保留**（迁移表 D3） |
| C-06 | `move-to-draft` | 废弃 | M1-A | → `move-to-planning` |
| C-07 | `metadata.writingStyle` | JSON 内 | M1-A | TASK-203 上提 `Project.writingStyle` |
| C-08 | `api.ts` | TS 7 值 | M1-A | 9 值唯一源（**Day 2 方案 C 移除 shelved**）|
| C-09 | `WorkDetailPage.tsx` | 状态字典不全 | M1-B | `utils/statusDict.ts` |
| C-10 | `WritingEditorPage.tsx` | 四模式 + 作品级 UI | M2 | pure-ify |
| C-11 | `Layout.tsx` | 缺文件暂存；企划 Tab 名 | M1-B | 立项总账 + 📂 L1 |
| C-12 | `App.tsx` | 无 `?from=` | M2 | searchParams |
| C-13 | `AuthGuard.tsx` | 绿条 | — | **非 M1 阻塞** |
| C-14 | `projects.ts` 体积 | transition/shelve 耦合 | M1-A | 与 C-04 同卡重构 |
| C-15 | 创意组 TASK-101/102 | Proposal 双轨 | M1-B | `v2-migration-map.md` §4 |
| C-16 | `HomePage`/`dashboard.ts` | 旧 status 聚合 | M2 | TASK-217 |
| C-17 | `proposals.ts` approve | 创建 `Project(draft)` | M1-A | → `planning` + 时间戳 + `proposalId` |
| C-18 | Chapter status | 三套枚举 | M2 | 锁 `draft/writing/completed` |
| **C-19** | `metadata._planningPhase` | schema/元数据有、**前端无子状态 UI** | **M2** | `WorkDetailPage` 或企划 Tab③ 显示 evaluating/setup/deferred；**不阻塞 TASK-200** |
| **C-20** | `proposalId` 关联 | DB 有、**前端无关联 UI** | **M1 验收必做** | `WorkDetailPage`「查看原提案」；企划课 Tab②「提案详情」入口（TASK-206~209） |
| **C-21** | Proposal `approved` | 创意组**无状态徽章** | **M1 验收必做** | 创意组「企划建议书」列表标「已通过评估」（TASK-206 或创意组适配卡） |
| C-22 | `/shelf` 路由 | 与文件暂存语义冲突 | M3 | → `/graveyard` 重定向（原 v4.1 表内「C-19」项，重编号避免与上列冲突） |

**计数**：21 条设计冲突（C-01~C-21）+ C-22 为 M3 路由债。

---

## M1 两阶段发卡（Claude × Cursor 共识）

| 阶段 | TASK | 范围 | 冲突 | 验收 |
|------|------|------|------|------|
| **M1-A** | 200~204 | schema + 迁移脚本 + 端点骨架（**纯后端**） | C-01~04, C-06~08, C-14, C-17 | 可跑通 TASK-203 SQL；端点可 curl |
| **M1-B** | 205~209 | 企划课 4 Tab + 文件暂存 + **关联 UI** | C-05, C-09, C-11, C-15, **C-20, C-21** | 4 Tab 链路不断；提案↔作品可跳转 |
| **M2** | 210~217 | 创作室 + 编辑器 | C-10, C-12, C-16, C-18, **C-19** | 编辑器 pure；子状态 UI 可选完善 |
| **M3** | 218~221 | 废弃旧 API、import、文档 | **C-22** | 无 `/shelf` 主路径 |

**门禁**：

- **TASK-200 可发**：§2.2 Q1/Q2 已锁 + 本表 C-01~C-18 已列 + §四/§五 与 §0 一致（v4.1.1 checklist 7/7 文档项绿）
- **M1 总验收**：M1-A + M1-B 完成，且 **C-20 / C-21 必须绿**；C-19 可延后到 M2

---

## 10 步落地顺序（v4.1.1）

| 步 | 内容 | 里程碑 |
|----|------|--------|
| **0** | `v2-migration-map.md` §2.2 评审 | ✅ 已锁 |
| 1 | C-01~03 schema + Proposal 扩展 | M1-A |
| 2 | C-07 + TASK-203 + §2.3 `proposalId` 回填 | M1-A |
| 3 | C-04~06 + C-17 端点（禁跨阶段） | M1-A |
| 4 | C-08 类型 | M1-A |
| 5 | 企划课 Tab ②③④ + **C-20/C-21** UI | M1-B |
| 6 | C-09 + C-11 + 文件暂存 | M1-B |
| 7 | C-10 + C-12 | M2 |
| 8 | C-16 + C-18 + **C-19** 子状态 UI | M2 |
| 9 | C-22 `/shelf`→`/graveyard` | M3 |
| 10 | 废弃旧 transition / StageTransitionModal 跨阶段 | M3 |

---

## TASK ↔ 冲突（修订）

| 里程碑 | TASK | 主要冲突 |
|--------|------|----------|
| **M1-A** | 200~204 | C-01~04, C-06~08, C-14, C-17 |
| **M1-B** | 205~209 | C-05, C-09, C-11, C-15, **C-20, C-21** |
| **M2** | 210~217 | C-10, C-12, C-16, C-18, **C-19** |
| **M3** | 218~221 | **C-22**, 废弃旧 API |

---

## 实现文件名对照

| 设计稿旧名 | VPS 实际 |
|------------|----------|
| `ProjectDetailPage` | `WorkDetailPage.tsx` |
| `EnhancedEditorPage` | `WritingEditorPage.tsx` |

---

## 本机孤儿文档（非 VPS）

| 文件 | 行数 | 处置 |
|------|------|------|
| `planning-dept-v2.md` | ~747 | 内容在 `overall-architecture.md` §四；**勿作权威**，本机可删 |
| `writing-studio-v2.md` | ~748 | 内容在 `overall-architecture.md` §五；**勿作权威**，本机可删 |

VPS 仓库**从未包含**上述两文件，无需 VPS 侧清理。
