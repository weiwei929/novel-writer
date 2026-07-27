# TASK-700 执行卡序列（阶段一 · 对齐后）

> **状态**：现役索引 · 最后核对 2026-07-27  
> **上游计划**：[TASK-700-v2.7.27-pipeline-completion.md](./TASK-700-v2.7.27-pipeline-completion.md)  
> **侦察**：[TASK-700-A-cursor-scout.md](./TASK-700-A-cursor-scout.md)（已完成）  
> **分支 HEAD**：`c399843`（与 origin 同步）

审卡四条：不超范围、假设已声明、验证可执行、回滚真能回。

---

## 已吸收结论

1. `/creative/chat` 已是 Workspace → **改名 `/creative/workspace`**，删 `ChatPage`；禁止新建总览。  
2. `*Actions` 死组件不以之为现役改点；创作室侧错误样板 `StudioActions` 在 700-D 删除。  
3. WorkDetail 企划放行错接线必须修（700-B）。  
4. **拍板 F（缓冲区）**：创作室只 `release-to-editorial`；开审在编审部。原「submit 合一直达 reviewing」方案已驳回。  
5. 创作手记：`chapterPlanning` **进**；记录层 700-F（`c52d00c`）；呈现层 700-G（`66d7415`）。  
6. **阶段一人工走查暂缓**（2026-07-27）——验收未完成，不阻塞后续卡。  
7. `kind` 区分时间戳可信度；呈现层必须显著标注 `initial`；弹窗文案按 kind 分岔（700-H）。  
8. **§四·五**：验收残留必须逐项清理并回报；删零引用文件前先判「废弃 vs 入口丢失」。  
9. 创意组：四来源 → 缘起 → 构思页；AI 讨论整块缺失，用冻结占位显式占回（700-H）。

---

## 执行卡队列

| 卡 | 标题 | 状态 | commit |
|----|------|------|--------|
| [700-A](./TASK-700-A-cursor-scout.md) | 侦察对齐 | ✅ 已完成 | 报告在会话；计划文档见 `58629d3` |
| [700-B](./TASK-700-B-workdetail-release-miswire.md) | WorkDetail 企划放行错接线 | ✅ 已完成 | `d9cc4ad` |
| [700-C](./TASK-700-C-review-mark-reviewed.md) | ReviewDetail 标记已审 | ✅ 已完成 | `4a5ad52` |
| [700-D](./TASK-700-D-submit-review-handoff-unify.md) | 详情补提交编审 + 删 StudioActions | ✅ 已完成 | `316350a` |
| [700-E](./TASK-700-E-creative-entry-cleanup.md) | 路由改名 + 删 ChatPage | ✅ 已完成 | `c2453e9` |
| [700-F](./TASK-700-F-work-note-recording-layer.md) | 创作手记 · 后端记录层 | ✅ 已完成 | `c52d00c` |
| [700-G](./TASK-700-G-work-note-presentation.md) | 创作手记 · 编审呈现层 | ✅ 已完成 | `66d7415`（卡/纪律 `d87ee99`） |
| [700-H](./TASK-700-H-creative-conceiving-workbench.md) | 创意组构思工作台 | ⏳ **待审授权** | — |

**下一枪**：审过 700-H 后执行。

---

## 显式未拆（H 之后 / 旁路）

- 创作手记 · 文集库入口与展示（§4.9；含 reviewed/归档后手记可读可续写）  
- 真正的 AI 讨论能力（解冻后另卡；本卡仅冻结占位）  
- 其余死 `*Actions`、桶内 `transition` 语义化  
- legacy 三表删除 + `acceptIntoPlanningCore` 解耦  
- `versionApi` / `EvaluationPage` / `MetadataPage`  
- `CURRENT_BASELINE`「暂不做」与拍板文档同步  
- **阶段一人工走查**（暂缓）  

---

## 侦察 / 验收数据清理

| 批次 | 状态 |
|------|------|
| `TASK700A-scout-*` | 已硬删（2+2） |
| `TASK700D-probe-1785122734422`（Project `e022d5f2` + Proposal `d4cfd0bb`） | ✅ 2026-07-27 已硬删；WorkNote 0；《美丽的一天》《新创意》未受影响 |
