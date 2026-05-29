# TASK-002: 部署鉴权中间件

- **状态**: ⏳ 待执行
- **架构师**: Claude
- **操作员**: Netcatty
- **创建日期**: 2026-05-29
- **前置任务**: TASK-001（已部署）

---

## 背景

新增了全局鉴权中间件，所有 API 路由（除了 `/api/v2/auth/*` 和 `/health`）现在都需要 Bearer token 才能访问。需要部署到 VPS。

## 操作步骤

### 1. 拉取最新代码

```bash
cd /opt/novel-writer
git pull origin master
```

预期看到 `b030c34` 被合并。

### 2. 重新构建后端

```bash
cd /opt/novel-writer/backend && npm run build
```

### 3. 重启服务

```bash
pm2 restart novel-writer-backend
```

## 验证方法

### 验证 1：无 token 的请求被拦截

```bash
# 不带 token 访问 projects 列表（应该被拒绝）
curl -s http://localhost:5000/api/v2/projects
# 预期输出: {"success":false,"error":{"code":401,"message":"未认证，请先登录"}}
```

### 验证 2：登录后拿到 token

```bash
# 登录获取 token
curl -s -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"novel2024"}'
# 预期输出包含 sessionId
```

### 验证 3：带 token 的请求正常

```bash
# 用上一步拿到的 token 访问
TOKEN="替换为上面返回的sessionId"
curl -s http://localhost:5000/api/v2/projects \
  -H "Authorization: Bearer $TOKEN"
# 预期输出: 正常的 projects 列表 JSON
```

### 验证 4：公开路由不受影响

```bash
curl -s http://localhost:5000/health
# 预期: HTTP 200

curl -s http://localhost:5000/api/v2/auth/status
# 预期: 正常返回 JSON
```

## 回滚方案

如果部署后前端无法登录，检查 frontend 是否需要重新构建：

```bash
cd /opt/novel-writer/frontend && npm run build
pm2 restart novel-writer-backend
```
