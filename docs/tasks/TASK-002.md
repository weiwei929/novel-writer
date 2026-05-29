# TASK-002: 部署批量更新（鉴权中间件 + 错误处理 + 配置清理）

- **状态**: ⏳ 待执行
- **架构师**: Claude
- **操作员**: Netcatty
- **创建日期**: 2026-05-29
- **前置任务**: TASK-001（已部署）

---

## 背景

本次包含 3 个 commit 的批量部署：

| Commit | 改动内容 |
|---|---|
| `b030c34` | **全局鉴权中间件** — 所有 API 路由需要 Bearer token |
| `5f94042` | 任务卡文档 |
| `37e3297` | **错误处理修复** + 配置清理 + 版本信息更新 |

## 操作步骤

### 1. 拉取最新代码

```bash
cd /opt/novel-writer
git pull origin master
```

预期看到 3 个 commit 被合并。

### 2. 重新构建后端

```bash
cd /opt/novel-writer/backend && npm run build
```

### 3. 重新构建前端

```bash
cd /opt/novel-writer/frontend && npm run build
```

### 4. 重启服务

```bash
pm2 restart novel-writer-backend
```

## 验证方法

### 验证 1：无 token 的请求被拦截

```bash
curl -s http://localhost:5000/api/v2/projects
# 预期: {"success":false,"error":{"code":401,"message":"未认证，请先登录"}}
```

### 验证 2：登录后拿到 token

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"novel2024"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['sessionId'])")
echo "TOKEN=$TOKEN"
```

### 验证 3：带 token 的请求正常

```bash
curl -s http://localhost:5000/api/v2/projects \
  -H "Authorization: Bearer $TOKEN"
# 预期: 正常的 projects 列表 JSON
```

### 验证 4：公开路由不受影响

```bash
curl -s http://localhost:5000/health
# HTTP 200
```

## 回滚方案

```bash
cd /opt/novel-writer
git reset --hard HEAD@{3}
pm2 restart novel-writer-backend
```
