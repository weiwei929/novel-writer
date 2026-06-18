# P1 封口核验：VPS 执行指令

> **模式**：只读审计，不修改任何文件
> **范围**：VPS 上 `v2-dev` 当前 HEAD
> **目标**：P1 封口的真实证据链，不依赖任何推断

---

## 一、VPS 命令集

请在 VPS 上依次执行以下命令并逐条回报原始输出。**不要概括，不要省略。**

### 1. commit 链
```bash
git log --oneline -8
```

### 2. 工作区是否干净
```bash
git status --short --branch
```

### 3. 远端是否同步
```bash
git log --oneline origin/v2-dev -5
```

### 4. 构建是否通过
```bash
cd frontend && npm run build 2>&1
```
注：如果 `vite build` 耗时太长，可以只做 `npx tsc -b` 类型检查。

### 5. 全库 `/work/` 导航入口
```bash
grep -rn '`/work/' frontend/src/pages/ frontend/src/components/ --include='*.tsx' --include='*.ts'
grep -rn "'/work/" frontend/src/pages/ frontend/src/components/ --include='*.tsx' --include='*.ts'
grep -rn '"/work/' frontend/src/pages/ frontend/src/components/ --include='*.tsx' --include='*.ts'
```
（分别匹配模板字符串、单引号、双引号的 `/work/` 引用）

### 6. 全库文案
```bash
grep -rn '查看作品\|作品详情\|返回作品详情\|查看企划' frontend/src/ --include='*.tsx' --include='*.ts'
```

---

## 二、回报格式

请按以下格式回报（**仅 VPS 真实输出，不要推测**）：

```
=== P1 封口核验回报 ===

## 1. git log --oneline -8
（原样粘贴输出）

## 2. git status --short --branch
（原样粘贴输出）

## 3. git log --oneline origin/v2-dev -5
（原样粘贴输出）

## 4. npm run build
（原样粘贴输出）

## 5. /work/ 导航入口
（原样粘贴输出）

## 6. 文案
（原样粘贴输出）
```

不需要总结、不需要分析、不需要判断。原始输出即可。
