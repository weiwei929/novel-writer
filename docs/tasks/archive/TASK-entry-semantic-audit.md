# TASK: 入口语义审计 — 跨部门 "查看作品" / "/work/:id" 入口扫描

> **模式**：只读审计，不修改
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **依据**：0608 五部门三工作区上下文隔离原则

---

## 背景

创意组"已接收入企划课"列表中的"查看作品"入口使用裸 `/work/:id`（无 `?from=`），当作品状态已进入 `writing` 时，WorkDetailPage 落入无部门上下文状态，导致 badge 和动作与真实状态不匹配。

司令部分析：这不是单一组件问题，是**全项目入口语义遗留问题**。

---

## 审计方法

### 1. 搜索所有 `/work/:id` 入口

```bash
# 搜索所有 navigate 和 Link 中包含 /work/ 的代码
grep -rn "/work/" --include="*.tsx" --include="*.ts" frontend/src/ | grep -v node_modules | grep -v ".d.ts" | grep -v ".spec." | grep -v "__tests__"

# 同时搜索 template literal 模式
grep -rn '`/work/' --include="*.tsx" --include="*.ts" frontend/src/ | grep -v node_modules
```

### 2. 搜索所有 `from=` 出现处

```bash
grep -rn "from=" --include="*.tsx" --include="*.ts" frontend/src/ | grep -v node_modules | grep -v "import\|from '\|from \""
```

### 3. 检查每个入口的上下文

对每个匹配到的入口，阅读所在文件，逐条记录：

| 元数据 | 取值 |
|--------|------|
| 文件路径 | ... |
| 行号 | ... |
| 入口文案 | "查看作品" / "查看详情" / 等 |
| 来源部门 | 创意组 / 企划课 / 创作室 / 编审部 / 文集库 / 全局 |
| 跳转目标 | `/work/:id` 或 `/work/:id?from=X` |
| 当前 `from` | 固定值 / 无 / 动态 |
| 是否根据 status 动态选择 | 是 / 否 |
| 风险判断 | 🔴 🟠 🟡 ✅ |

### 4. 特别检查 ProjectCard

`ProjectCard` 被多个部门复用（见 App.tsx 路由）。检查：
- 它传入的 `project` prop 的 status 范围
- 它使用的 `navigate(/work/${project.id})` 的上下文
- 父组件传递 `onOpen` 回调时是否带了 `from`

### 5. 检查 `badgePhase` 回落逻辑

```bash
grep -n "badgePhase\|isPlanningContext\|isWritingContext\|isEditorialContext\|isLibraryContext" frontend/src/pages/WorkDetailPage.tsx | head -20
```

### 6. 检查是否有可复用的 status→context 映射（仅记录，不实现）

```bash
grep -rn "getWorkContext\|statusToPhase\|statusToDept" --include="*.ts" --include="*.tsx" frontend/src/ | grep -v node_modules
```

---

## 审计报告格式

### 摘要表

| 文件 | 行号 | 入口文案 | 来源部门 | 跳转目标 | 当前 from | 是否动态 | 风险等级 | 判断 |
|------|------|----------|----------|----------|-----------|----------|----------|------|
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### 分类统计

```
## 风险分布
🔴 高: N 处
🟠 中: N 处
🟡 低: N 处
✅ 合规: N 处

## 按来源部门分布
创意组: N 处
企划课: N 处
创作室: N 处
编审部: N 处
文集库: N 处
全局/共享组件: N 处
```

### 关键发现说明

对每个 🔴 高危入口，附：

```
### [文件:行号]
- 入口文案: ...
- 问题: （说明为何跨部门上下文错误）
- 举例: 当作品状态为 X 时，进入后 badge 显示 Y，动作区显示 Z
- 建议 fix: （不实现，仅建议）
```

---

## 约束

- ❌ 不修改文件
- ❌ 不 stage / commit / push
- ✅ 仅 grep / read / git log
