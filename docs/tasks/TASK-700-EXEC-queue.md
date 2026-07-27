# TASK-700 执行卡序列（阶段一 · 对齐后）

> **状态**：现役索引 · 最后核对 2026-07-27  
> **上游计划**：[TASK-700-v2.7.27-pipeline-completion.md](./TASK-700-v2.7.27-pipeline-completion.md)  
> **侦察**：[TASK-700-A-cursor-scout.md](./TASK-700-A-cursor-scout.md)（已完成）  
> **分支 HEAD**：`c2453e9`（与 origin 同步）

审卡四条：不超范围、假设已声明、验证可执行、回滚真能回。

---

## 已吸收结论

1. `/creative/chat` 已是 Workspace → **改名 `/creative/workspace`**，删 `ChatPage`；禁止新建总览。  
2. `*Actions` 死组件不以之为现役改点；创作室侧错误样板 `StudioActions` 在 700-D 删除。  
3. WorkDetail 企划放行错接线必须修（700-B）。  
4. **拍板 F（缓冲区）**：创作室只 `release-to-editorial`；开审在编审部。原「submit 合一直达 reviewing」方案已驳回。  
5. 创作手记：`chapterPlanning` **进**；记录层见 700-F。  
6. **阶段一人工走查暂缓**（2026-07-27）——验收未完成，**不阻塞** 700-F。

---

## 执行卡队列

| 卡 | 标题 | 状态 | commit |
|----|------|------|--------|
| [700-A](./TASK-700-A-cursor-scout.md) | 侦察对齐 | ✅ 已完成 | 报告在会话；计划文档见 `58629d3` |
| [700-B](./TASK-700-B-workdetail-release-miswire.md) | WorkDetail 企划放行错接线 | ✅ 已完成 | `d9cc4ad` |
| [700-C](./TASK-700-C-review-mark-reviewed.md) | ReviewDetail 标记已审 | ✅ 已完成 | `4a5ad52` |
| [700-D](./TASK-700-D-submit-review-handoff-unify.md) | 详情补提交编审 + 删 StudioActions | ✅ 已完成 | `316350a` |
| [700-E](./TASK-700-E-creative-entry-cleanup.md) | 路由改名 + 删 ChatPage | ✅ 已完成 | `c2453e9` |
| [700-F](./TASK-700-F-work-note-recording-layer.md) | 创作手记 · 后端记录层 | ✅ **已完成** | 见回报 / 待填 commit |

**合入顺序（已执行）**：B → C → D → E。  
**下一枪**：授权后执行 F（含 schema；先备份 `dev.db`）。

---

## 显式未拆（F 之后）

- 创作手记呈现：编审左右分栏、`note` 编辑、文集入口（§4.5 / §4.9）  
- 其余死 `*Actions`、桶内 `transition` 语义化  
- legacy 三表删除 + `acceptIntoPlanningCore` 解耦  
- `versionApi` / `EvaluationPage` / `MetadataPage`  
- `CURRENT_BASELINE`「暂不做」与拍板文档同步  
- **阶段一人工走查**（暂缓）  

---

## 侦察数据

`TASK700A-scout-*` 已硬删（2+2），无需再清。
