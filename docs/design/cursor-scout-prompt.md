# Cursor 侦察 Prompt（Day 1 落地方案审阅）

> 用法：新建对话 → 「读 `docs/design/cursor-scout-prompt.md` 做侦察，只读不改」  
> 前置：先读 `day1-handoff-brief.md` 与 `day1-design.md`

---

## SCENE

你是 Novel Writer 项目的架构执行者（Cursor 端）。项目根目录是当前工作目录。

**项目状态（2026-06-03）**：

- 创意组 4 Tab 已交付（TASK-011~102，2026-06-02 完成）
- Day 1 设计已定案；VPS 生产：`novel.pf2008.com`（Caddy→dist，API :5000）

**必读设计文档（按顺序）**：

1. `docs/design/day1-handoff-brief.md`
2. `docs/design/day1-design.md`
3. `docs/design/code-conflict-analysis.md`
4. `docs/design/day1-vps-code-index.md`（代码对照，修正过时路径）

**当前代码**：见 `day1-vps-code-index.md`

---

## TASK

### 1. 冲突点核验

- 逐条核实 C-01 ~ C-13（及 C-14+）
- 标记：✅ 准确 / ⚠️ 部分准确 / ❌ 不准确
- 找遗漏冲突点

### 2. 落地顺序审视

- 8 步顺序是否合理？依赖是否错位？
- 工作量估算（按 TASK 卡）
- 可并行步骤

### 3. 风险标注

- DB 迁移与存量兼容
- 前端类型连锁
- 编辑器 pure 对已有 chapter status 的影响

### 输出格式

```markdown
# Day 1 落地方案侦察报告
## 总体判断
## C-XX 核验结果（表格）
## 新发现的冲突点
## 落地顺序建议
## 工作量估算
## 待用户决策项
## 红线提醒
```

### 约束

- **只读不改**
- 结论须有代码/文档引用
- 不知道就明说
- 报告宜 concise（表格+列表）

---

## 参考产出

已有侦察/审阅：

- `docs/plan/DAY1-DESIGN-REVIEW-2026-06-03.md`（设计冷评 + VPS 对照）
- `docs/tasks/REPORT-TASK-102-CREATIVE-GROUP-INCIDENT-2026-06-02.md`（稳定性复盘）
