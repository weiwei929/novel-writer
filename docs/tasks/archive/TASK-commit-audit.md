# TASK-COMMIT-AUDIT：`c1ee91a..d4fc68a` 未确认提交审计

> ⚠️ **只读审计** — 不修改、不 stage、不 commit、不 push、不 stash。
> **范围**：`c1ee91a`（P2-A，已确认）之后、`d4fc68a`（hygiene，已确认）之前的所有 commit。
> **目的**：逐条审计，供司令部决定追认/revert/修正。

---

## 基线

已确认的锚点 commit：
| Hash | 阶段 | 司令部状态 |
|------|------|-----------|
| `f768af6` | P1 企划课 | ✅ 已确认 |
| `c1ee91a` | P2-A 创作室列表 | ✅ 已确认 |
| `d4fc68a` | P2 hygiene 守卫收口 | ✅ 已确认 |

需审计范围：`c1ee91a..d4fc68a`（不包含两端）

---

## 审计命令

### 0. 确认范围列表
```bash
git log --oneline c1ee91a..d4fc68a
```

### 1. 逐条输出完整信息
```bash
# 以 machine-readable 格式输出范围内所有 commit
git log --format="=== COMMIT %h ===%nAuthor: %an%nDate: %ai%nMessage: %s%n%b%nFiles:%n" --name-only c1ee91a..d4fc68a
```

### 2. 逐条 show stat
```bash
for h in $(git log --format="%h" c1ee91a..d4fc68a); do
  echo "--- $h ---"
  git show --stat --oneline $h
  echo ""
done
```

### 3. 后端 schema 检查
```bash
# 看是否改了 schema / migration
for h in $(git log --format="%h" c1ee91a..d4fc68a); do
  files=$(git show --name-only $h | grep -iE "schema|migration|prisma")
  if [ -n "$files" ]; then
    echo "⚠️ $h touches schema/migration:"
    echo "$files"
  fi
done
```

### 4. 检查 Review/Reader/AI 相关
```bash
for h in $(git log --format="%h" c1ee91a..d4fc68a); do
  files=$(git show --name-only $h | grep -iE "Review|Reader|AI|Ai|ai")
  if [ -n "$files" ]; then
    echo "⚠️ $h touches Review/Reader/AI:"
    echo "$files"
  fi
done
```

### 5. 检查 StageTransitionModal 相关
```bash
for h in $(git log --format="%h" c1ee91a..d4fc68a); do
  files=$(git show --name-only $h | grep -iE "StageTransition|stageManage")
  if [ -n "$files" ]; then
    echo "⚠️ $h touches StageTransitionModal:"
    echo "$files"
  fi
done
```

### 6. 检查状态流/端点变更
```bash
for h in $(git log --format="%h" c1ee91a..d4fc68a); do
  files=$(git show --name-only $h | grep -iE "routes/projects|stage-guard|project-transitions")
  if [ -n "$files" ]; then
    echo "⚠️ $h touches backend status/endpoints:"
    echo "$files"
  fi
done
```

### 7. Build 验证
```bash
# 尽可能对每个 commit 做 staged-only build 验证（需先 stash WT 或只 build staged）
# 当前 WT 有污染，尝试 git stash save "audit-wt-save" → build → git stash pop
# 若 stash 后 build 通过，说明 HEAD 本身无 build 问题
```

---

## 产出格式

每条 commit 按以下格式报告：

```
=== 8ba7c16 ===
阶段: P2-A+
文件: frontend/src/pages/WorkDetailPage.tsx (+24, -3)
说明: 增加 isWritingContext、start-writing 语义动作
风险:
  - backend schema/migration: 无
  - Review/Reader/AI: 无
  - StageTransitionModal: 是（stageManageButton 条件收紧）
  - 状态流/端点: 无
  - 0608 原则违反: 无（审计已覆盖，⚠️ 已由 d4fc68a 修复）
build: 该枪 staged-only build 通过（原回报）
建议: ⭐ 建议追认
```

---

## 最终汇总

按阶段分组统计：

```
## P2-A+
- 8ba7c16: ⭐ 建议追认

## P2-B
- b72f130: ⭐ 建议追认

## P3 (编审部)
- 5022026: ⭐ 建议追认
- cd5f119: ⭐ 建议追认
- 9b784dd: ⭐ 建议追认
- 377d470: ⭐ 建议追认
- 6d9669b: ⭐ 建议追认

## P4 (文集库)
- b184e6f: ⭐ 建议追认
- 451f97e: ⭐ 建议追认
- 7176666: ⭐ 建议追认
- 6f4d9d0: ⭐ 建议追认
- 6253623: ⭐ 建议追认
```

---

## 约束

❌ 不修改文件
❌ 不 stage / commit / push / stash（除非 build 验证需临时 stash，且必须 pop）
✅ 仅读取、git log、git show、git diff
