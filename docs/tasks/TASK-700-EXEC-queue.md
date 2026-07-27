# TASK-700 执行卡序列（阶段一 · 对齐后）

> **状态**：现役索引 · 最后核对 2026-07-27  
> **上游计划**：[TASK-700-v2.7.27-pipeline-completion.md](./TASK-700-v2.7.27-pipeline-completion.md)  
> **侦察**：[TASK-700-A-cursor-scout.md](./TASK-700-A-cursor-scout.md)（已完成）

审卡四条：不超范围、假设已声明、验证可执行、回滚真能回。

---

## 已吸收结论

1. `/creative/chat` 已是 Workspace → **改名 `/creative/workspace`**，删 `ChatPage`；禁止新建总览。  
2. `*Actions` 死组件不以之为现役改点；创作室侧错误样板 `StudioActions` 在 700-D 删除。  
3. WorkDetail 企划放行错接线必须修（700-B）。  
4. **F（缓冲区）**：创作室只 `release-to-editorial`；开审在编审部。原「submit 合一直达 reviewing」方案已驳回。  
5. 创作手记：`chapterPlanning` **进**（已拍板）；§4.4/§4.8 矛盾已由司令官侧修正——**不再阻塞开手记卡**。

---

## 执行卡队列

| 卡 | 标题 | 状态 | 依赖 |
|----|------|------|------|
| [700-A](./TASK-700-A-cursor-scout.md) | 侦察对齐 | ✅ 已完成 | — |
| [700-B](./TASK-700-B-workdetail-release-miswire.md) | WorkDetail 企划放行错接线 | ✅ **已完成** | — |
| [700-C](./TASK-700-C-review-mark-reviewed.md) | ReviewDetail 标记已审 | ✅ **已完成** | 可与 B 并行 |
| [700-D](./TASK-700-D-submit-review-handoff-unify.md) | 详情补提交编审 + 删 StudioActions | ⏳ **退回重写 · 待再审** | 建议 B 后 |
| [700-E](./TASK-700-E-creative-entry-cleanup.md) | 路由改名 + 删 ChatPage | ⏳ **二选一定死 · 待授权** | 可并行 |

**建议合入顺序**：B → C →（审过的 D）→（授权后的 E）。

---

## 显式未拆（下一轮）

- 创作手记 `WorkNote`（chapterPlanning **已拍板：进**；可开卡）  
- 其余死 `*Actions`、桶内 `transition` 语义化  
- legacy 三表删除 + `acceptIntoPlanningCore` 解耦  
- `versionApi` / `EvaluationPage` / `MetadataPage`  
- `CURRENT_BASELINE`「暂不做」与 D 拍板文档同步  

---

## 侦察数据

`TASK700A-scout-*` 已硬删（2+2），无需再清。
