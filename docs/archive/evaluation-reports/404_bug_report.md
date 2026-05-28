# 🐛 Bug Report: Metadata Confirmation Endpoint Returns 404

## 问题描述

用户在 AI 元数据提取流程中，点击"确认并保存"按钮时，前端收到 **404 Not Found** 错误，但**数据实际上已成功保存到数据库**。

## 复现步骤

1. 导入一个 Markdown 文件到暂存池
2. 将项目转入创作（状态变为 `draft`）
3. 打开编辑器，看到"元数据缺失"提示
4. 点击"启动 AI 协助"
5. 等待 AI 生成元数据，模态框弹出
6. 点击"确认并保存"
7. **错误出现**：前端显示 "操作失败，没有待确认的元数据"

## 错误信息

### 前端控制台错误
```
Failed to load resource: the server responded with a status of 404 (Not Found)
api.ts:64 API Error: AxiosError
POST http://localhost:3000/api/v2/projects/{id}/confirm-metadata 404 (Not Found)
```

### 关键观察

1. ✅ **数据已保存**：检查项目元数据面板，AI 生成的内容已经存在
2. ❌ **前端收到 404**：请求返回 404 状态码
3. ❌ **错误提示不准确**：显示"没有待确认的元数据"，但实际是 404 错误

## 已验证的信息

### 后端路由存在
- 文件：`backend/src/routes/projects.ts`
- 路由定义：第 351 行
  ```typescript
  app.post('/:id/confirm-metadata', async (req: FastifyRequest<ConfirmMetadataBody>, reply) => {
  ```
- 路由注册：`backend/src/index.ts` 第 40 行
  ```typescript
  server.register(projectRoutes, { prefix: '/api/v2/projects' })
  ```

### 前端请求正确
- 文件：`frontend/src/services/api.ts`
- 方法：第 194-196 行
  ```typescript
  async confirmMetadata(id: string, confirmed: boolean, editedMetadata?: Record<string, any>): Promise<void> {
    await api.post(`/projects/${id}/confirm-metadata`, { confirmed, editedMetadata })
  }
  ```

### 后端服务状态
- ✅ 后端服务正常运行（端口 5000）
- ✅ 其他 API 端点工作正常（如 `move-to-draft`）
- ✅ curl 测试返回 400（JSON 格式错误），说明路由可访问

## 可能的原因

### 1. 响应格式问题（已修复但未生效）
最近修改了返回格式：
```typescript
// 修改前
return { success: true, message: '元数据已确认并保存' }

// 修改后
return ApiResponse.success(null, '元数据已确认并保存')
```

但修改后仍然返回 404。

### 2. Vite 代理配置问题
前端请求 `http://localhost:3000/api/v2/...`，应该被代理到 `http://localhost:5000/api/v2/...`

检查：`frontend/vite.config.ts`
```typescript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true
  }
}
```

### 3. 路由匹配问题
可能存在其他路由先匹配了请求，导致 404。

### 4. TypeScript 编译错误
后端可能有未显示的编译错误。

## 需要调查的方向

1. **检查后端日志**
   - 请求是否到达后端
   - 是否有路由匹配日志
   - 是否有错误堆栈

2. **检查 Vite 代理**
   - 代理是否正常工作
   - 请求是否被正确转发

3. **检查路由顺序**
   - 是否有其他路由先匹配
   - 路由参数是否正确

4. **验证请求格式**
   - 请求 URL 是否正确
   - 请求 body 是否符合 schema

## 调试建议

### 1. 添加后端日志
在 `confirm-metadata` 端点开头添加：
```typescript
app.post('/:id/confirm-metadata', async (req: FastifyRequest<ConfirmMetadataBody>, reply) => {
  req.log.info({ id: req.params.id, body: req.body }, 'Confirm metadata request received')
  // ... 其余代码
})
```

### 2. 测试直接请求
在浏览器控制台运行：
```javascript
fetch('/api/v2/projects/test-id/confirm-metadata', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({confirmed: true})
}).then(r => r.json()).then(console.log)
```

### 3. 检查 Network 标签
- 打开浏览器开发者工具
- 切换到 Network 标签
- 点击"确认并保存"
- 查看实际请求的 URL、状态码、响应内容

### 4. 重启服务
完全停止并重启前后端服务，确保代码更改生效。

## 相关文件

### 后端
- `backend/src/routes/projects.ts` - 路由定义
- `backend/src/index.ts` - 路由注册
- `backend/src/utils/response.ts` - ApiResponse 工具

### 前端
- `frontend/src/services/api.ts` - API 客户端
- `frontend/src/components/import/MetadataReviewModal.tsx` - 确认模态框
- `frontend/vite.config.ts` - 代理配置

## 期望行为

1. 用户点击"确认并保存"
2. 前端发送 `POST /api/v2/projects/{id}/confirm-metadata`
3. 后端成功处理并返回 200
4. 前端显示成功通知
5. 模态框关闭
6. 元数据缺失提示消失

## 当前行为

1. 用户点击"确认并保存"
2. 前端发送请求
3. **收到 404 错误**
4. 显示错误通知："操作失败，没有待确认的元数据"
5. 但数据实际已保存

---

**优先级**: 🔴 高（阻塞核心功能）
**影响范围**: AI 元数据提取流程
**创建时间**: 2025-12-24 12:27
