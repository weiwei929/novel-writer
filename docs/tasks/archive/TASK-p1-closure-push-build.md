# P1 封口：push + clean build 验证

> **基线**：VPS `v2-dev` @ `4972cc1`
> **目标**：远端同步 + 干净 HEAD 构建验证
> **要求**：不破坏现有工作区

---

## 执行步骤

### Step 1 — Push 到 origin
```bash
git push origin v2-dev
```

### Step 2 — 验证远端已同步
```bash
git log --oneline origin/v2-dev -5
```

### Step 3 — 在干净 HEAD 快照跑 build

使用 git worktree 隔离现有 WT，不在 VPS 主工作区执行：

```bash
# 创建临时 worktree 指向当前 HEAD
git worktree add /tmp/p1-clean-build HEAD

# 在临时 worktree 中 build
cd /tmp/p1-clean-build/frontend && npm run build 2>&1

# 清理临时 worktree
cd /tmp && git worktree remove /tmp/p1-clean-build
```

如果 `npm run build` 时间太长，可以只做 tsc 检查：
```bash
cd /tmp/p1-clean-build && npx tsc -b --pretty 2>&1
```

### Step 4 — 确认 WT 不受影响
```bash
git status --short --branch
```

---

## 回报模板

回报时仅粘贴以下 5 项原始输出，不做分析：

```
=== P1 push + clean build 回报 ===

## 1. push 输出
（粘贴原始输出）

## 2. origin/v2-dev 最新 -5
（粘贴原始输出）

## 3. clean HEAD build 结果
（粘贴原始输出）

## 4. 最终 git status
（粘贴原始输出）

## 5. WT 是否受 push/build 影响
是/否（应回答：否。worktree 隔离了 WT）
```
