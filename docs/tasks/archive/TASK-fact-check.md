# TASK-FACT-CHECK：VPS origin 提交事实核验

> ⚠️ **只读核验** — 不修改、不 stage、不 commit、不 push。
> **目的**：澄清 `origin/v2-dev` 当前 HEAD 之后是否存在任何未经司令部确认的 P2-A+ / P2-B / P3 / P4 commit。

---

## 核验命令（逐条执行，逐条回报）

### 1. 完整提交历史
```bash
git log --oneline --decorate -15
```

### 2. HEAD 确认
```bash
git show --stat --oneline HEAD
```

### 3. 分支状态
```bash
git status --short --branch
```

### 4. 与 origin 关系
```bash
git log --oneline --decorate origin/v2-dev ^v2-dev
git log --oneline --decorate v2-dev ^origin/v2-dev
```
- 第一条：origin 有但本地没有的 commit
- 第二条：本地有但 origin 没有的 commit（如果有，说明有未推 commit）

### 5. 特定 hash 追踪

```bash
# 逐一检查这些 hash 是否存在于当前分支历史中
git cat-file -t 8ba7c16 2>/dev/null || echo "MISSING: 8ba7c16"
git cat-file -t b72f130 2>/dev/null || echo "MISSING: b72f130"
git cat-file -t 5022026 2>/dev/null || echo "MISSING: 5022026"
git cat-file -t b184e6f 2>/dev/null || echo "MISSING: b184e6f"
```

对每个存在的 hash，进一步确认它是否在 `v2-dev` 分支历史中：
```bash
git branch --contains 8ba7c16 2>/dev/null
git branch --contains b72f130 2>/dev/null
git branch --contains 5022026 2>/dev/null
git branch --contains b184e6f 2>/dev/null
```

如果存在但不在 `v2-dev` 中，再查 reflog：
```bash
git reflog --date=iso | grep -E "8ba7c16|b72f130|5022026|b184e6f"
```

### 6. 明确回答
请在回报结尾**明确回答**：

1. 当前本地 `v2-dev` HEAD 是什么？
2. 当前 `origin/v2-dev` HEAD 是什么？
3. 本地是否 ahead/behind origin？
4. `origin/v2-dev` 中是否存在 P2-A+ / P2-B / P3 / P4 的未经司令部确认 commit？
   如存在，列出 hash、message、涉及文件、与已确认 commit(f768af6/c1ee91a/d4fc68a) 的关系。
5. **4 个特定 hash 的逐条定位结论：**
   - `8ba7c16` → （存在于 v2-dev / 存在于其他分支 / 仅 reflog / 不存在）
   - `b72f130` → （同上）
   - `5022026` → （同上）
   - `b184e6f` → （同上）

---

## 约束

❌ 不修改任何文件
❌ 不 stage / commit / push
✅ 仅读取、grep、git log
