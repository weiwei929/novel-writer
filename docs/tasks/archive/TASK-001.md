# TASK-001: VPS 拉取最新代码并重启服务

- **状态**: ⏳ 待执行
- **架构师**: Claude
- **操作员**: Netcatty
- **创建日期**: 2026-05-29
- **前置任务**: 无

---

## 背景

GitHub 远程仓库已有 4 个新 commit，包含死代码清理和文档更新。需要同步到 VPS 并重启服务。

## 操作步骤

### 1. 进入项目目录并拉取最新代码

```bash
cd /opt/novel-writer
git pull origin master
```

### 2. 重新构建前端

```bash
cd frontend
npm run build
```

### 3. 重新构建后端

```bash
cd ../backend
npm run build
```

### 4. 重启 PM2 服务

```bash
pm2 restart novel-writer-backend
```

## 预期结果

- `git pull` 显示 `f0f7fd9` 被合并
- 前后端构建无报错
- PM2 重启后进程状态 `online`

## 验证方法

```bash
# 确认 git 版本
git log --oneline -1
# 应显示: f0f7fd9 docs: add task card system for architect-operator workflow

# 确认后端运行
pm2 show novel-writer-backend | grep status
# 应显示: status: online

# 确认 API 正常
curl -s http://localhost:5000/health
# 应返回 JSON（status: ok）

curl -s http://localhost:5000/api/v2/auth/status
# 应返回 JSON（含 requireAuth 和 authenticated 字段）
```

## 回滚方案

```bash
# 如果部署后服务异常，回退到上一个版本
cd /opt/novel-writer
git reset --hard HEAD@{1}
pm2 restart novel-writer-backend
```
