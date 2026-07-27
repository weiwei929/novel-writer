# 可信基线 v0.1 — 核心流程 E2E 验证清单

**状态**: 已执行（P0-D 后重跑）  
**执行时间**: 2026-05-22  
**Run ID（最新）**: `1779429759254`  
**Run ID（Commit 2 复核）**: `1779429759254`  
**Run ID（P0-C/P0-D）**: `1779428774499`  
**Run ID（Key 更新后）**: `1779428507770`  
**Run ID（P0-A）**: `1779428138147`  
**Run ID（首轮）**: `1779427937671`  
**验证脚本**: [`scripts/baseline-e2e-v01.mjs`](../scripts/baseline-e2e-v01.mjs)  
**依据文档**: 《当前产品真实基线审计》

---

## 0. P0-A/P0-B2：API Key 配置加载与模型验证（2026-05-22）

**改动文件**: `backend/src/services/SettingsManager.ts`

**规则（已实现）**:
1. `app-settings.json` 中 `ai.apiKey` 为非空字符串 → 优先使用
2. 为空、缺失或仅空白 → fallback 到 `process.env.GEMINI_API_KEY`
3. `getSettings()` 返回前统一 resolve，不将 key 写入日志

**验证**:
- `POST /api/v2/ai/test-connection`（body: `{}`）→ HTTP 200，`连接成功`
- 实际 `chat` 探测 → 通过
- 当前模型：`gemini-3.5-flash`

**结论**: 加载路径问题 **已修复**；有效 Key 配置后，F6/F7 已通过。B1/B1b 仍是审阅契约 blocker，不再是 Key 问题。

---

## 1. 范围与原则

| 项目 | 说明 |
|------|------|
| 目标 | 建立「可信基线 v0.1」，**非** UI 增强 |
| 方法 | API 层自动化 + 代码/路由探测；**未**跑浏览器 Playwright |
| 原则 | 只验证、不大改；pass/fail/blocker/skip 四态 |
| 权威 | 本文结果优先于 README「100% 完成」等营销描述 |

### 状态定义

| 状态 | 含义 |
|------|------|
| **pass** | 本次运行验证通过 |
| **fail** | 链路可达但行为错误或数据不一致 |
| **blocker** | 已知缺陷导致流程不可用；不可作为 Open Design 依据 |
| **skip** | 环境前置不满足（如 AI Key），未测 |

---

## 2. 如何复现

```bash
# 1. 启动后端
cd backend && npm run dev

# 2. 运行验证（另开终端）
node scripts/baseline-e2e-v01.mjs
```

**AI 相关用例前置**:
1. ~~`app-settings.json` 空 apiKey 覆盖 env~~ → **P0-A 已修复**
2. `.env` 或 Settings 中需配置**有效** Gemini Key
3. 验证脚本对 `test-connection` / `extract-metadata` 使用 `{}` body；并以 chat 探测二次确认 AI 可用

---

## 3. P0 核心流程验证结果

### 3.1 必须通过（基线 MVP）

| ID | 流程 | 状态 | 说明 |
|----|------|------|------|
| F1 | 创建项目 → 梗概 → 第1章 → 项目详情可读 | **pass** | `POST /projects` + metadata + `POST /chapters`；详情与章节列表一致 |
| F2 | 项目详情 → 三栏写作页（数据前置） | **pass** | `/editor/:projectId/:chapterId` 所需三元组 API 齐全；**UI 未浏览器实测** |
| F3 | 正文编辑 → 手动保存 → 切章持久化 | **pass** | `PUT /chapters/:id` 两章内容独立可读 |
| F4 | 项目元数据编辑 | **pass** | `metadata.characters` 写入/读回 |
| F5 | 章节元数据编辑 | **pass** | `Chapter.summary` 写入/读回（与前端 synopsis 映射一致） |
| F8 | Markdown 导出 | **pass** | `GET /projects/:id/export` 含标题与正文 |

### 3.2 AI 相关核心流程（有效 Key 后已通过）

| ID | 流程 | 状态 | 说明 |
|----|------|------|------|
| PREFLIGHT-AI | AI 连接可用性 | **pass** | `test-connection` 与 chat 探测均成功，模型 `gemini-3.5-flash` |
| F6 | AI 写作助手（chat 返回内容） | **pass** | `/ai/chat` 返回有效正文 |
| F7 | AI 元数据手动提取 → 确认 | **pass** | `_draft` 清除，正式字段入库：`synopsis`, `characters`, `settings`, `timeline`, `relationships`, `plotStructure` |

> **注**: `test-connection` 当前不校验 chat 返回值，存在**假阳性**；脚本已增加 chat 探测作为 gate。

### 3.3 导入子流程（补充探测，非原 P0 必过项）

| ID | 流程 | 状态 | 说明 |
|----|------|------|------|
| F-IMP-1 | Markdown 导入入库 | **pass** | 使用 `docs/archive/test-files/test-valid-import.md`；3 章创建，`status=imported` |
| F-IMP-2 | 转入创作 `move-to-draft` | **pass** | `status→draft`，collection 切换，`wordCount` 更新 |
| F-IMP-3 | 导入响应 `hasPendingMetadata` | **blocker** | 后端仅返回 `{ project }`；前端 `FileImportExport` 期望该字段 — 永不为 true |
| F-IMP-4 | 导入后自动元数据提取 | **blocker** | import handler 不调用 `extractMetadataInBackground` |

---

## 4. 已知 Blocker 登记（暂缓链路）

| ID | 链路 | 状态 | Fail 原因 |
|----|------|------|-----------|
| B1 | 编辑器 AI 章节审阅（`AIReviewPanel` 原调用方式） | **blocker** | 脚本探测旧调用 `reviewChapter(content)` 只传 1 参；后端要求 `chapterId`+`content` → HTTP 400 |
| B1b | 审阅响应格式 | **blocker** | 正确 API 可返回 Markdown，但 UI 结构化 `ReviewReport` 体验未实现；当前仅可作实验性 Markdown 展示 |
| B2 | 章节规划保存（`ChapterPlanningEditor`） | **blocker** | `projectsApi.updateChapterPlanning` 在 api.ts / backend **均不存在** |
| B3 | 导入后自动元数据 | **blocker** | 见 F-IMP-3/4 |
| B4 | 深度策划 `PlannerBoard` AI | **blocker** | `POST /ai/generate/outline` → HTTP 404 |
| B5 | 导航 `/editor` 裸路由 | **pass** | P0-C 已修复：`/editor` 重定向到 `/projects` |

---

## 5. 手动 UI 清单（待第二轮浏览器验证）

以下 P0 项 API 已通过，**建议在配置 AI Key 后人工点验一次**：

- [ ] `CreateProjectModal` 完整提交（非脚本直连 API）
- [ ] 项目详情 →「写作」→ 三栏布局渲染
- [ ] Monaco 编辑 → 点「保存」→ 刷新后内容仍在
- [ ] 顶栏「项目/章节元数据」抽屉打开与保存
- [ ] DualModeSwitch「领航」→ AI 回复 →「正文」插入光标处
- [ ] 看板完结项目 → 导出 `.md` 下载

---

## 6. 可信基线 v0.1 裁决

### 6.1 结论：**有限基线（Partial Baseline）**

| 维度 | 裁决 |
|------|------|
| 非 AI 核心写作闭环 | **成立** — F1–F5、F8 全部 pass |
| AI 增强能力 | **成立一部分** — AI 写作助手与 AI 元数据手动提取已通过 |
| 高风险旁路 | **5 条 blocker** — 不得作为 Open Design / UI 设计依据 |

### 6.2 Open Design Brief 可引用的事实

**可以写进 Brief 的（已验证）**：

1. 项目创建 → 章节 → 编辑器路由 `/editor/:projectId/:chapterId`
2. 正文手动保存与多章持久化
3. 项目/章节元数据 CRUD（summary 与 metadata 双轨仍存在）
4. Markdown 导出
5. 导入入库 + 看板转入创作（**不含**导入后 AI 元数据）
6. AI 写作助手基础 chat 返回
7. AI 元数据手动提取与确认入库

**不可写进 Brief 的（blocker / 未验证）**：

1. 编辑器内 AI 审阅侧栏的结构化审阅体验
2. 编辑器内章节规划保存
3. 深度策划 AI 生成
4. 导入后自动 AI 元数据链
5. README 声称的：自动保存、拖拽排序、JSON 导出、AI 95%/100% 完成

### 6.3 环境说明（P0-A 后）

| 问题 | 状态 |
|------|------|
| 空 `app-settings.json` apiKey 覆盖 env | **已修复**（`resolveApiKey`） |
| `.env` `GEMINI_API_KEY` | **当前可用**，测试阶段使用；后续正式整理前建议轮换 |
| `test-connection` 假阳性 | **已知**；脚本已用 chat 探测缓解 |

---

## 7. 最新汇总（Run `1779429759254`）

```
PASS: 12   FAIL: 0   BLOCKER: 5   SKIP: 0   TOTAL: 17
PREFLIGHT-AI / F6 / F7: pass
B5: pass
B1/B1b/B2/B3/B4: blocker
```

首轮（Run `1779427937671`）因加载 bug 导致 PREFLIGHT-AI skip；P0-A 后加载正常；有效 Key 与模型更新后，AI 写作和 AI 元数据链路通过。

---

## 8. 下一步（仍属基线阶段，非 UI 增强）

| 优先级 | 动作 | 类型 | 状态 |
|--------|------|------|------|
| P0-A | 修复 AI Key 加载（空 apiKey fallback env） | 配置/小改 | **done** |
| P0-B | 重跑 `baseline-e2e-v01.mjs` | 验证 | **done** |
| P0-B2 | 配置**有效** Gemini Key 后重跑 F6/F7/B1b | 验证 | **done**（F6/F7 pass；B1b 仍 blocker） |
| P0-C | 元数据字段治理与裸 `/editor` 路由修复 | 小改 | **done** |
| P0-D | 前端 build 基线收口 | 小改 | **done** |
| P0-UI | 浏览器手动清单 §5 | 验证 | pending |
| P1 | blocker 修复方案（审阅/规划/导入） | 计划 | pending |

---

**维护**: 每次基线验证后更新 Run ID、结果表与 §6 裁决。Open Design 启动条件：P0 非 AI 全 pass + AI 用例 pass 或明确 accept skip。
