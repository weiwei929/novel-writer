# 创意组故障与修复报告（TASK-102 验收期）

> **日期**：2026-06-02  
> **环境**：VPS `novel.pf2008.com`，分支 `v2-dev`（含 commit `3d282fe` 及后续热修）  
> **目的**：供与 Claude 讨论——故障归因、设计 vs 实现、后续改进建议  

---

## 1. 执行摘要

TASK-102 在功能层面（创意讨论 / 创意提案 / 企划建议书 / 主页聚合）**已实现并可走通数据流**；验收阶段暴露的主要是 **运行时稳定性、认证会话、前端 Hook 依赖、部署模式混用** 四类问题，而非「模块未开发」。

| 现象 | 根因类别 | 主要责任 |
|------|----------|----------|
| `ReferencesPage-*.js` 动态导入失败 | 部署/缓存（生产 HTML + 开发反代混用） | 运维切换 + 浏览器缓存 |
| 灵感手记 / 外来参考「加载失败」刷屏 | 实现缺陷（`useNotifications` 不稳定引用） | **实现** |
| 页面显示「已通过认证」但 API 401 | 实现 + 运维（内存会话 + AuthGuard 不复检） | **实现**为主 |
| 创意讨论一直「加载中」 | 同上（无限 `load` 循环） | **实现** |
| 登录后 API 502 | 运维（nodemon 监听会话写盘触发重启） | **实现/运维** |
| 旧灵感 `tags` 为逗号字符串 | 历史数据 / 模型演进 | **数据遗留**，设计未强调 |

**结论（客观）**：TASK-102 的 **产品与数据流设计基本合理**；故障集中在 **前端工程细节、认证与会话策略、VPS 开发部署流程**，属于实现与运维范畴，不应归结为「设计错误导致模块做不出来」。

---

## 2. 背景：TASK-102 设计要点（Claude / 任务卡侧）

任务卡与 `CREATIVE-GROUP-DESIGN.md` 约定：

1. **创意讨论** → 提交 → `Proposal`（`draft`，`metadata._evaluation` 等）
2. **创意提案详情** →「进入企划建议书」→ `status = submitted`
3. **企划建议书 evaluate** → `approve` 创建 `Project(draft)` + Type1 全文拆章
4. **主页** 五段卡片聚合各模块
5. 评估意见为 **自由文本**，非结构化审批
6. 引用材料跨灵感手记 + 外来参考（`ReferencePicker`）

上述设计与代码结构（`CreativeDiscussion`、`PlanningProposal`、`ProposalDetailPage`、`dashboard.ts`、后端 `proposals` CRUD + `/evaluate`）**一致**，验收时 API 在正确 token 下可返回 200。

---

## 3. 故障时间线与修复

### 3.1 生产包与开发反代混用（`ReferencesPage` chunk）

**现象**  
```
Failed to fetch dynamically imported module:
https://novel.pf2008.com/assets/ReferencesPage-BIKb32bB.js
```

**原因**  
- 浏览器缓存了 **旧版生产 `index.html`**，其中懒加载 `ReferencesPage`（TASK-101 之前路由产物）。
- 当时 Caddy 临时改为反代 **Vite :3000**；对 `/assets/xxx.js` 未知路径，Vite 返回 **`index.html`（HTML）**，浏览器按 JS 解析失败。
- 当前代码已将 `/creative/references` **重定向到** `/creative/external-refs`，新 build **不再包含** `ReferencesPage` chunk。

**归因**  
| 设计 | 实现 | 运维 |
|------|------|------|
| 路由更名合理（外来参考取代 ReferencesPage） | 已做 redirect | **dev/prod 混用 + 未强制刷新** 触发 |

**修复**  
- 恢复 Caddy → `frontend/dist` 生产静态；`npm run build` 最新包。  
- `index.html` 增加 `Cache-Control: no-cache`。  
- 用户强制刷新 / 清站点缓存。

---

### 3.2 灵感手记 / 外来参考：加载失败（多 toast）

**现象**  
左侧「加载中…」，右侧多条「加载失败 / 无法获取灵感手记（或外来参考）」。

**后端**  
`GET /api/v2/scraps`、`/api/v2/external-refs` 在有效 Bearer token 下 **200**；数据库有数据。

**前端根因（核心）**  

```tsx
// 问题模式（ScrapNote / ExternalRefs / CreativeDiscussion / PlanningProposal 等）
const { error: notifyError } = useNotifications()

const load = useCallback(async () => {
  setLoading(true)
  try { ... } catch { notifyError('加载失败', ...) }
  finally { setLoading(false) }
}, [notifyError])  // notifyError 每次渲染是新函数

useEffect(() => { void load() }, [load])  // → 无限触发 load
```

原 `useNotifications` 每次 render 返回 **新对象/新函数**，导致：
- `load` 每次重建 → `useEffect` 无限执行；
- 每次 `setLoading(true)` → UI 长期「加载中」；
- 并发失败请求 → **多条相同错误 toast**。

**次要因素**  
- 后端 **内存 Session**；`nodemon` 重启后会话清空，localStorage token 失效 → **401**；  
- `AuthGuard` 初版包在 `RouterProvider` **之外**，`useLocation` 无效，且 **仅在 mount 校验一次** → 仍显示「已通过认证」；  
- 开发时登录写 `data/sessions.json` 触发 **nodemon 重启** → 短暂 **502**。

**归因**  
| 设计 | 实现 |
|------|------|
| 任务卡未规定 Hook 写法 | **`useNotifications` 稳定性缺失**（明确实现 bug） |
| 单用户 Bearer 合理 | **会话仅内存 + 未文档化 dev 重启行为** |
| — | **AuthGuard 放置与复检策略不当** |

**修复**  
- `useNotifications` 用 `useCallback` + Zustand selector 稳定化；  
- `AuthGuard` 移入路由树，`location.pathname` 变化时复检；401 派发 `novel:auth-expired`；  
- Session 持久化（后改为 `/tmp/novel-writer-sessions.json` + nodemon 只 watch `src/`）；  
- `scrapsApi` / `externalRefsApi` / `proposalsApi` 对 `response.data` 做 `Array.isArray` 防御；  
- `normalizeScrapTags` / `normalizeTagsField` 兼容逗号分隔字符串（旧数据）。

---

### 3.3 创意讨论「像在加载、没有实现」

**现象**  
用户认为创意讨论未实现。

**实际情况**  
`CreativeDiscussion.tsx` 已实现三栏布局、新建讨论、`ReferencePicker`、保存草稿、提交提案、右侧成型列表；路由 `/creative/chat` 已注册。

**真实问题**  
与 3.2 **相同的无限 `load` 循环** → 左侧长期「加载中…」，功能不可用，**观感像未开发**。

**次要 UX**  
库中既有 `Proposal` 多为 `submitted` 等非 `draft`，待讨论列表为空时，修复后应显示「暂无讨论，点击新建」——属 **空状态**，非缺失功能。已将 `rejected` 提案纳入可回到「待讨论」。

**归因**  
| 设计 | 实现 |
|------|------|
| 设计清晰 | **Hook 依赖 bug 掩盖了已实现 UI** |

---

## 4. 责任矩阵（客观）

### 4.1 实现侧（Cursor Agent / 本仓代码）— 主责

1. **`useNotifications` 未保证引用稳定** — React 常见坑，属编码疏忽。  
2. **`AuthGuard` 架构** — 放在 Router 外、不随路由/会话失效复检。  
3. **Session 策略** — 仅内存；dev 写盘触发 nodemon；未在 README/任务卡写明「重启需重登」。  
4. **部署验证** — 切换 Vite 反代时未同步说明缓存风险。  
5. **数据兼容** — TASK-101/102 假设 `tags` 为数组，未处理 DB 中逗号字符串（应实现期迁移或统一 normalize）。

### 4.2 设计 / 任务卡侧（Claude 产出）— 次要或无责

1. **数据流与模块划分** — 合理，与实现一致。  
2. **未规定** — 认证在 SPA 中的复检时机、dev 会话持久化、生产/开发 Caddy 切换流程（属 **工程规范缺口**，非业务设计错误）。  
3. **ReferencesPage → ExternalRefs 迁移** — 设计演进正常；需配套 **迁移说明 + 缓存提示**（文档层）。  
4. **空数据验收** — 任务卡用示意图列举多条讨论；未强调「零数据时的空状态」验收项（轻微）。

### 4.3 环境与用户操作 — 触发条件

- 浏览器强缓存旧 `index.html` / JS。  
- 后端多次重启未重新登录。  
- 在 dev 反代与 dist 静态之间切换未刷新。

---

## 5. 与 Claude 的讨论提纲

1. **设计是否过度？**  
   - 创意讨论用 `Proposal` + `metadata._discussionSubmitted` 表达阶段，与「提案 / 企划建议书」共用模型，**略耦合但可接受**；若 Claude 倾向独立 `Discussion` 表，属于 **二期简化**，非当前故障原因。

2. **验收标准是否应补充？**  
   建议 TASK 类卡增加：  
   - 登出/重启后端后 API 行为；  
   - 列表页无 `useEffect` 依赖不稳定函数；  
   - 生产 build 后域名访问 checklist（含硬刷新）；  
   - 旧数据字段形态（如 `tags` string vs array）。

3. **实现质量**  
   功能 breadth 达标；**稳定性与认证边界**在首轮合并时未达生产级，属 **工程债**，已在热修中偿还大部分。

4. **是否回滚 TASK-102 设计？**  
   **不建议**。问题不在管线设计，而在 Hook、Auth、DevOps。

---

## 6. 已落地修复清单（供对照）

| 文件/区域 | 改动摘要 |
|-----------|----------|
| `frontend/src/hooks/useNotifications.ts` | 稳定 `success` / `error` 回调 |
| `frontend/src/components/auth/AuthGuard.tsx` | 路由内 `Outlet`、路径变化复检、401 事件 |
| `frontend/src/App.tsx` | 路由外包 `AuthGuard` |
| `frontend/src/services/api.ts` | 401 事件、`Array.isArray`、tags 解析、`getProposalMetadata` |
| `frontend/src/components/creative/scrapUtils.ts` | 逗号分隔 tags |
| `frontend/src/components/creative/CreativeDiscussion.tsx` | `rejected` 回待讨论 |
| `backend/src/services/auth/sessionStore.ts` | 会话 `/tmp` 持久化、写盘节流 |
| `backend/nodemon.json` | 仅 watch `src/` |
| Caddy `novel.pf2008.com` | 生产 `dist` + `index.html` no-cache |

**尚未单独 commit 的热修**（截至本报告撰写时）：上述项在 `3d282fe` 之后于工作区逐步应用，建议合并为  
`fix: 创意组稳定性 — 认证复检/通知 Hook/会话与部署`  

---

## 7. 建议后续（设计与实现共同）

1. **实现**：为创意组列表页增加集成测试或 Playwright smoke（登录 → scraps → chat 新建）。  
2. **设计/doc**：在 `CURSOR_REFERENCE.md` 增加「VPS 开发：dist vs vite、重启后重登」。  
3. **数据**：Prisma seed 或迁移脚本将 `Scrap.tags` 统一为 JSON 数组。  
4. **设计（可选）**：`Discussion` 与 `Proposal` 分表，降低 `metadata` 约定复杂度——**非紧急**。

---

## 8. 一句话结论（给 Claude）

**TASK-102 的创意组产品设计可用且与代码对齐；用户可见故障主要来自实现层的 React Hook 依赖错误、认证会话与开发部署操作，而非 Claude 设计的业务管线错误。** 修复后应通过「强制刷新 + 重新登录 + 创意讨论点新建」完成验收；若仍失败，优先查 Network 状态码与 token，而非重做模块设计。

---

*报告人：Cursor Agent（实施与热修）*  
*关联提交：`c269050`（TASK-101）、`3d282fe`（TASK-102）、本报告后热修待提交*
